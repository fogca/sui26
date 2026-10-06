import { fail } from '@sveltejs/kit';
import {
	listAllProducts,
	listStockMoves,
	getSettings,
	getProductById,
	adjustStock
} from '$lib/shop/store.js';

// Reasons offered for a manual adjustment. Sent to the client through load() so
// the list is defined once — +page.server.js may not export anything but the
// hooks SvelteKit knows about.
const REASONS = ['入荷', '棚卸調整', '破損・廃棄', '返品戻し', 'その他'];
const OTHER = 'その他';
/** Reason stamped on the one-tap −1 / +1 buttons, which have no reason picker. */
const QUICK_REASON = '手動調整';
const MAX_QTY = 999;
const MOVES_LIMIT = 100;

// Timestamps are ISO UTC in the DB; the shop is run from Japan, so every stamp
// on screen is JST. Formatting happens here so SSR and hydration agree.
const F_STAMP = new Intl.DateTimeFormat('sv-SE', {
	timeZone: 'Asia/Tokyo',
	dateStyle: 'short',
	timeStyle: 'short'
});

function stamp(iso) {
	if (!iso) return '';
	const d = new Date(iso);
	return Number.isNaN(d.getTime()) ? '' : F_STAMP.format(d);
}

function num(v) {
	const n = Number(v);
	return Number.isFinite(n) ? n : 0;
}

export async function load({ platform, url }) {
	const db = platform.env.DB;
	const productId = url.searchParams.get('p') ?? '';
	// The table is published-only by default; drafts can hold stock too, so the
	// owner can opt into seeing everything.
	const showAll = url.searchParams.get('all') === '1';

	const [products, settings, moves] = await Promise.all([
		listAllProducts(db),
		getSettings(db),
		listStockMoves(db, { productId: productId || null, limit: MOVES_LIMIT })
	]);

	const threshold = num(settings.low_stock_threshold);
	// Totals always describe the published catalogue, whatever the table shows,
	// so the numbers don't move when the owner toggles the view.
	const published = products.filter((p) => p.status === 'published');
	const inStock = published.filter((p) => num(p.stock) > 0);

	const stats = {
		totalUnits: published.reduce((s, p) => s + num(p.stock), 0),
		publishedCount: published.length,
		outOfStock: published.filter((p) => num(p.stock) <= 0).length,
		lowStock: published.filter((p) => num(p.stock) > 0 && num(p.stock) <= threshold).length,
		stockValue: inStock.reduce((s, p) => s + num(p.stock) * num(p.cost), 0),
		costMissing: inStock.filter((p) => num(p.cost) <= 0).length
	};

	const rows = (showAll ? products : published)
		.map((p) => ({
			id: p.id,
			name: p.name,
			sku: p.sku ?? '',
			stock: num(p.stock),
			status: p.status,
			image: p.images?.[0] ?? ''
		}))
		.sort((a, b) => a.stock - b.stock || a.name.localeCompare(b.name, 'ja'));

	return {
		rows,
		stats,
		threshold,
		reasons: REASONS,
		maxQty: MAX_QTY,
		movesLimit: MOVES_LIMIT,
		showAll,
		productId,
		// every product, so a draft's history can still be filtered for
		options: products.map((p) => ({ id: p.id, name: p.name })),
		moves: moves.map((m) => ({
			id: m.id,
			stamp: stamp(m.created_at),
			name: m.product_name ?? '',
			delta: num(m.delta),
			reason: m.reason ?? '',
			actor: m.actor ?? ''
		}))
	};
}

export const actions = {
	// One entry point for both the ±1 buttons and the full adjustment form.
	adjust: async ({ request, platform }) => {
		const db = platform.env.DB;
		const form = await request.formData();
		const id = String(form.get('id') ?? '');
		const sign = String(form.get('sign') ?? '');
		const qty = Number(form.get('qty'));
		const picked = String(form.get('reason') ?? '').trim();
		const memo = String(form.get('memo') ?? '').trim();

		if (!id) return fail(400, { error: '商品が指定されていません。' });
		if (sign !== 'in' && sign !== 'out') {
			return fail(400, { error: '入庫か出庫かを選んでください。' });
		}
		if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) {
			return fail(400, { error: `数量は1〜${MAX_QTY}の整数で入力してください。` });
		}
		if (picked !== QUICK_REASON && !REASONS.includes(picked)) {
			return fail(400, { error: '理由を選んでください。' });
		}
		if (picked === OTHER && !memo) {
			return fail(400, { error: '「その他」を選んだときは、補足欄に理由を入力してください。' });
		}

		const product = await getProductById(db, id);
		if (!product) return fail(404, { error: '商品が見つかりませんでした。' });

		const reason = picked === OTHER ? memo : memo ? `${picked}／${memo}` : picked;
		const wanted = sign === 'out' ? -qty : qty;
		const res = await adjustStock(db, id, wanted, reason, 'admin');

		if (!res || !res.ok) {
			return fail(409, { error: '在庫を更新できませんでした。もう一度お試しください。' });
		}
		if (res.delta === 0) {
			return fail(400, { error: `${product.name} の在庫は0点のため、これ以上減らせません。` });
		}

		const applied = `${res.delta > 0 ? '+' : ''}${res.delta}`;
		// adjustStock clamps at 0 — say so rather than reporting the requested figure.
		const clamped =
			res.delta !== wanted ? `　※在庫が足りなかったため ${applied} で止めました。` : '';
		return {
			message: `${product.name} を ${applied} しました（${reason}）。現在の在庫は ${res.stock} 点です。${clamped}`
		};
	}
};
