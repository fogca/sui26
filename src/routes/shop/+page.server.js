import { listPublishedProducts, getSettings } from '$lib/shop/store.js';

export async function load({ platform }) {
	const [products, settings] = await Promise.all([
		listPublishedProducts(platform.env.DB),
		getSettings(platform.env.DB)
	]);
	return {
		products: products.map((p) => ({
			id: p.id,
			slug: p.slug,
			name: p.name,
			spec: p.spec,
			price: p.price,
			stock: p.stock,
			image: p.images[0] ?? null
		})),
		settings: { shipping_fee: settings.shipping_fee, free_over: settings.free_over }
	};
}
