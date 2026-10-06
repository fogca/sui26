import { error, fail } from '@sveltejs/kit';
import {
	getOrderById,
	getCustomer,
	getSettings,
	listActivity,
	logActivity,
	markShipped,
	cancelOrder,
	refundOrder,
	saveOrderNote,
	updateOrderShipping
} from '$lib/shop/store.js';

function int(v) {
	const n = parseInt(String(v ?? ''), 10);
	return Number.isFinite(n) ? n : 0;
}

/** Shared field reader for the two shipping-prep actions. */
function prepFields(form) {
	return {
		tracking: String(form.get('tracking') ?? '').trim(),
		carrier: String(form.get('carrier') ?? '').trim(),
		message: String(form.get('message') ?? '').trim(),
		notify: form.get('notify') === 'on'
	};
}

/** Persist the shipping-prep draft. carrier / ship_message are real columns
 *  (migration 0005), so this is a plain UPDATE and reads need no log scan. */
async function savePrep(db, order, f) {
	await db
		.prepare('UPDATE orders SET tracking_no = ?, carrier = ?, ship_message = ? WHERE id = ?')
		.bind(f.tracking, f.carrier, f.message, order.id)
		.run();
}

/** Activity rows carry either the internal id or the human order_no as target,
 *  depending on which store helper wrote them — match both. Oldest first, so
 *  the timeline reads top-to-bottom like a story. */
function timelineFor(rows, order) {
	const keys = new Set([order.id, order.order_no].filter(Boolean));
	return rows
		.filter((r) => keys.has(r.target))
		.sort((a, b) => String(a.at ?? '').localeCompare(String(b.at ?? '')));
}

export async function load({ platform, params }) {
	const db = platform.env.DB;
	const order = await getOrderById(db, params.id);
	if (!order) error(404, '注文が見つかりません');

	const [settings, log, customer] = await Promise.all([
		getSettings(db),
		listActivity(db, 300),
		order.email ? getCustomer(db, order.email) : Promise.resolve(null)
	]);

	const events = timelineFor(log, order);

	return {
		order,
		settings,
		events,
		shipPrep: { carrier: order.carrier ?? '', message: order.ship_message ?? '' },
		// summary only — getCustomer() also returns every order that customer
		// ever placed, which this screen never renders
		customer: customer
			? { email: customer.email, name: customer.name, stats: customer.stats, tags: customer.tags }
			: null
	};
}

export const actions = {
	/** Step 2 of the shipping-prep flow: keep the typed values, keep the status.
	 *  Lets the owner walk away mid-packing without losing anything. */
	prep: async ({ request, platform, params }) => {
		const db = platform.env.DB;
		const order = await getOrderById(db, params.id);
		if (!order) return fail(404, { error: 'オーダーが見つかりません。' });
		await savePrep(db, order, prepFields(await request.formData()));
		return { saved: 'prep' };
	},

	/** Step 3: finish the shipment. Status 未発送 -> 完了. */
	ship: async ({ request, platform, params }) => {
		const db = platform.env.DB;
		const order = await getOrderById(db, params.id);
		if (!order) return fail(404, { error: 'オーダーが見つかりません。' });
		if (order.status !== 'paid') {
			return fail(409, {
				error: 'このオーダーはすでに未発送ではありません。画面を再読み込みしてください。'
			});
		}
		const form = await request.formData();
		const f = prepFields(form);
		await savePrep(db, order, f);
		await markShipped(db, params.id, f.tracking);
		if (f.carrier || f.message) {
			await logActivity(db, {
				action: 'order.ship_info',
				target: order.order_no ?? order.id,
				detail: [f.carrier, f.message].filter(Boolean).join(' / ')
			});
		}
		// Mail is not wired up yet; record the intent instead of pretending.
		if (f.notify) {
			await logActivity(db, {
				action: 'order.notify_skipped',
				target: order.order_no ?? order.id,
				detail: '発送完了メールは未接続のため送信されていません'
			});
		}
		return { saved: 'ship' };
	},

	/** Fix the tracking number of an order that already shipped.
	 *  markShipped() is deliberately NOT reused here: it re-stamps shipped_at
	 *  with "now" and would destroy the real dispatch time. */
	tracking: async ({ request, platform, params }) => {
		const db = platform.env.DB;
		const order = await getOrderById(db, params.id);
		if (!order) return fail(404, { error: '注文が見つかりません。' });
		const form = await request.formData();
		const no = String(form.get('tracking') ?? '').trim();
		await db.prepare('UPDATE orders SET tracking_no = ? WHERE id = ?').bind(no, order.id).run();
		await logActivity(db, {
			action: 'order.tracking',
			target: order.order_no ?? order.id,
			detail: no || '（削除）'
		});
		return { saved: 'tracking' };
	},

	cancel: async ({ request, platform, params }) => {
		const db = platform.env.DB;
		const order = await getOrderById(db, params.id);
		if (!order) return fail(404, { error: '注文が見つかりません。' });
		if (order.status !== 'paid' && order.status !== 'shipped') {
			return fail(409, { error: 'この注文はキャンセルできる状態ではありません。' });
		}
		const form = await request.formData();
		await cancelOrder(db, params.id, form.get('restock') === 'on');
		return { saved: 'cancel' };
	},

	/** Bookkeeping only — the money is refunded in the Stripe dashboard. */
	refund: async ({ request, platform, params }) => {
		const db = platform.env.DB;
		const form = await request.formData();
		const amount = int(form.get('amount'));
		if (amount < 0) return fail(400, { error: '返金額が不正です。' });
		const res = await refundOrder(db, params.id, amount, String(form.get('reason') ?? '').trim());
		if (!res.ok) {
			const messages = {
				not_found: '注文が見つかりません。',
				already_refunded: 'すでに全額返金済みです。',
				conflict: '返金額が合計を超えています。金額を確認してください。'
			};
			return fail(400, { error: messages[res.error] ?? '返金を記録できませんでした。' });
		}
		return { saved: 'refund', amount: res.amount };
	},

	note: async ({ request, platform, params }) => {
		const form = await request.formData();
		await saveOrderNote(platform.env.DB, params.id, String(form.get('note') ?? ''));
		return { saved: 'note' };
	},

	shipping: async ({ request, platform, params }) => {
		const db = platform.env.DB;
		const order = await getOrderById(db, params.id);
		if (!order) return fail(404, { error: '注文が見つかりません。' });
		const form = await request.formData();
		const s = (k) => String(form.get(k) ?? '').trim();

		const name = s('name');
		if (!name) return fail(400, { error: 'お届け先の氏名は必須です。' });

		await updateOrderShipping(db, params.id, {
			name,
			phone: s('phone'),
			email: s('email'),
			address: {
				zip: s('zip'),
				state: s('state'),
				city: s('city'),
				line1: s('line1'),
				line2: s('line2')
			},
			delivery_note: s('delivery_note'),
			gift: form.get('gift') === 'on'
		});
		return { saved: 'shipping' };
	}
};
