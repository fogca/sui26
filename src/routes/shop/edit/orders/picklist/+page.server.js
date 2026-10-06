import { listOrders, listAllProducts } from '$lib/shop/store.js';

/**
 * Pick list: what to take off the shelf, aggregated by item across every
 * unshipped (paid) order. The owner walks the shelves once, not once per
 * order, so quantities are summed and order numbers are listed alongside.
 */
export async function load({ platform }) {
	const db = platform.env.DB;
	const [orders, products] = await Promise.all([listOrders(db, 'paid'), listAllProducts(db)]);

	const skuById = new Map(products.map((p) => [p.id, p.sku ?? '']));

	// Group by product_id when known, otherwise by name — a legacy order may
	// carry a line with no product reference and must still be picked.
	const map = new Map();
	for (const o of orders) {
		for (const it of o.items ?? []) {
			const key = it.product_id || `name:${it.name}`;
			const row = map.get(key) ?? {
				key,
				name: it.name ?? '（名称なし）',
				sku: skuById.get(it.product_id) ?? '',
				qty: 0,
				orders: []
			};
			row.qty += Number(it.qty) || 0;
			if (!row.orders.includes(o.order_no)) row.orders.push(o.order_no);
			map.set(key, row);
		}
	}

	const rows = [...map.values()].sort((a, b) => b.qty - a.qty || a.name.localeCompare(b.name));

	return {
		rows,
		orderCount: orders.length,
		totalQty: rows.reduce((sum, r) => sum + r.qty, 0)
	};
}
