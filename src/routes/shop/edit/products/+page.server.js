import { listAllProducts } from '$lib/shop/store.js';

export async function load({ platform }) {
	const products = await listAllProducts(platform.env.DB);
	return { products };
}
