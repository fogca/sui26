import { error, fail, redirect } from '@sveltejs/kit';
import {
	deleteProduct,
	getProductById,
	listCategories,
	productSlugExists,
	updateProduct
} from '$lib/shop/store.js';
import { parseProductForm } from '$lib/shop/validate.js';

export async function load({ params, platform, url }) {
	const product = await getProductById(platform.env.DB, params.id);
	if (!product) throw error(404, 'Not found');
	const categories = await listCategories(platform.env.DB);
	return { product, categories, created: url.searchParams.get('created') === '1' };
}

export const actions = {
	save: async ({ request, params, platform }) => {
		const { error: err, errors, values } = parseProductForm(await request.formData());
		if (err) return fail(400, { error: err, errors, values });
		if (await productSlugExists(platform.env.DB, values.slug, params.id)) {
			return fail(400, {
				error: 'その slug は既に使われています',
				errors: { slug: 'その slug は既に使われています' },
				values
			});
		}
		await updateProduct(platform.env.DB, params.id, values);
		// stay on the screen so the owner sees the result of the save
		return { ok: true, at: new Date().toISOString() };
	},

	delete: async ({ params, platform }) => {
		await deleteProduct(platform.env.DB, params.id);
		throw redirect(303, '/shop/edit/products');
	}
};
