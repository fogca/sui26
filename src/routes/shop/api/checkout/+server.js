import { json, error } from '@sveltejs/kit';
import { getProductById, getSettings } from '$lib/shop/store.js';
import { createCheckout } from '$lib/shop/stripe.js';

const MAX_QTY = 9;

// Public: create a checkout from cart items. Prices and stock are always
// re-validated server-side — the client only sends ids and quantities.
export async function POST({ request, platform, url }) {
	const body = await request.json().catch(() => null);
	const rawItems = body?.items;
	if (!Array.isArray(rawItems) || rawItems.length === 0 || rawItems.length > 20) {
		throw error(400, 'バッグが空です');
	}

	const db = platform.env.DB;

	// Aggregate duplicate ids FIRST — per-line checks alone can be bypassed by
	// repeating the same product across lines.
	const merged = new Map();
	for (const raw of rawItems) {
		const qty = Math.floor(Number(raw?.qty));
		if (!raw?.id || !Number.isFinite(qty) || qty < 1) {
			throw error(400, '不正な数量です');
		}
		merged.set(String(raw.id), (merged.get(String(raw.id)) ?? 0) + qty);
	}

	const items = [];
	for (const [id, qty] of merged) {
		if (qty > MAX_QTY) {
			throw error(400, `数量は1商品につき${MAX_QTY}点までです`);
		}
		const p = await getProductById(db, id);
		if (!p || p.status !== 'published') {
			throw error(400, '取り扱いのない商品が含まれています');
		}
		if (p.stock < qty) {
			throw error(409, `「${p.name}」の在庫が不足しています（残り${p.stock}点）`);
		}
		items.push({ product_id: p.id, name: p.spec ? `${p.name}（${p.spec}）` : p.name, price: p.price, qty });
	}

	const settings = await getSettings(db);
	const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
	// Free shipping is decided on the PRE-discount subtotal (same rule STORES
	// uses). A promotion code applied inside Checkout does not re-price shipping.
	const shipping = subtotal >= settings.free_over ? 0 : settings.shipping_fee;

	let checkoutUrl;
	try {
		({ url: checkoutUrl } = await createCheckout(platform, { items, shipping, origin: url.origin }));
	} catch (e) {
		if (e?.message === 'payments not configured') {
			throw error(503, '決済の準備中です。しばらくしてからお試しください。');
		}
		throw e;
	}
	return json({ url: checkoutUrl });
}
