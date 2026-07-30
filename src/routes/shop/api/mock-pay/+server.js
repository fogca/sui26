import { json, error } from '@sveltejs/kit';
import { isMockMode } from '$lib/shop/stripe.js';
import { getProductById, getSettings, createPaidOrder } from '$lib/shop/store.js';

// Mock-mode only: simulate a successful Stripe payment. Runs the exact same
// fulfillment path as the real webhook so the whole flow can be exercised
// locally. Disabled entirely once STRIPE_SECRET_KEY is configured.
export async function POST({ request, platform }) {
	if (!isMockMode(platform)) throw error(404, 'not available');

	const body = await request.json().catch(() => null);
	const { items: rawItems, customer } = body ?? {};
	if (!Array.isArray(rawItems) || !rawItems.length || rawItems.length > 20) {
		throw error(400, 'empty cart');
	}

	// Client may supply a stable session id so double-submits stay idempotent.
	const sid =
		typeof body?.session_id === 'string' && /^mock_[0-9a-f-]{36}$/.test(body.session_id)
			? body.session_id
			: 'mock_' + crypto.randomUUID();

	const db = platform.env.DB;

	// Same aggregation rules as the real checkout endpoint.
	const merged = new Map();
	for (const raw of rawItems) {
		const qty = Math.floor(Number(raw?.qty));
		if (!raw?.product_id || !Number.isFinite(qty) || qty < 1) throw error(400, 'bad item');
		merged.set(String(raw.product_id), (merged.get(String(raw.product_id)) ?? 0) + qty);
	}
	const items = [];
	for (const [id, qty] of merged) {
		if (qty > 9) throw error(400, 'qty limit exceeded');
		const p = await getProductById(db, id);
		if (!p || p.status !== 'published') throw error(400, 'unknown product');
		if (p.stock < qty) throw error(409, `在庫不足: ${p.name}`);
		items.push({ product_id: p.id, name: p.spec ? `${p.name}（${p.spec}）` : p.name, price: p.price, qty });
	}

	const settings = await getSettings(db);
	const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
	const shipping = subtotal >= settings.free_over ? 0 : settings.shipping_fee;

	const { order } = await createPaidOrder(db, {
		provider: 'mock',
		session_id: sid,
		items,
		subtotal,
		shipping,
		total: subtotal + shipping,
		email: customer?.email ?? 'test@example.com',
		name: customer?.name ?? 'テスト購入者',
		phone: customer?.phone ?? '',
		address: {
			zip: customer?.zip ?? '',
			state: customer?.state ?? '',
			city: customer?.city ?? '',
			line1: customer?.line1 ?? '',
			line2: ''
		},
		delivery_note: customer?.timeslot && customer.timeslot !== 'none' ? customer.timeslot : '',
		gift: !!customer?.gift,
		note: customer?.note ? `【お客様備考】${customer.note}` : ''
	});

	return json({ ok: true, session_id: order.session_id });
}
