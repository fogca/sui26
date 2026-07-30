import { json } from '@sveltejs/kit';
import { listPublishedProducts } from '$lib/shop/store.js';

// Public: light catalog for the cart drawer (name/price/stock lookup).
export async function GET({ platform, setHeaders }) {
	const products = await listPublishedProducts(platform.env.DB);
	setHeaders({ 'Cache-Control': 'no-store' });
	return json(
		products.map((p) => ({
			id: p.id,
			slug: p.slug,
			name: p.name,
			spec: p.spec,
			price: p.price,
			stock: p.stock,
			image: p.images[0] ?? null
		}))
	);
}
