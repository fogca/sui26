import { error } from '@sveltejs/kit';
import { getPublishedProduct, getSettings } from '$lib/shop/store.js';

export async function load({ params, platform }) {
	const [product, settings] = await Promise.all([
		getPublishedProduct(platform.env.DB, params.slug),
		getSettings(platform.env.DB)
	]);
	if (!product) throw error(404, 'Not found');
	return {
		product,
		settings: { shipping_fee: settings.shipping_fee, free_over: settings.free_over }
	};
}
