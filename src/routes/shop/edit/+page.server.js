import { getDashboardStats, listOrders, listAllProducts } from '$lib/shop/store.js';

export async function load({ platform }) {
	const db = platform.env.DB;
	const [stats, unshipped, products] = await Promise.all([
		getDashboardStats(db),
		listOrders(db, 'paid'),
		listAllProducts(db)
	]);
	return {
		stats,
		unshipped: unshipped.slice(0, 5),
		lowStock: products.filter((p) => p.status === 'published' && p.stock <= 3)
	};
}
