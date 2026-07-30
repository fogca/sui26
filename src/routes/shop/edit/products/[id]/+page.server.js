import { error, fail, redirect } from '@sveltejs/kit';
import { getProductById, updateProduct, deleteProduct, productSlugExists } from '$lib/shop/store.js';
import { parseProductForm } from '$lib/shop/validate.js';

export async function load({ params, platform }) {
	const product = await getProductById(platform.env.DB, params.id);
	if (!product) throw error(404, 'Not found');
	return { product };
}

export const actions = {
	save: async ({ request, params, platform }) => {
		const { error: err, values } = parseProductForm(await request.formData());
		if (err) return fail(400, { error: err, values });
		if (await productSlugExists(platform.env.DB, values.slug, params.id)) {
			return fail(400, { error: 'その slug は既に使われています', values });
		}
		await updateProduct(platform.env.DB, params.id, values);
		throw redirect(303, '/shop/edit/products');
	},
	delete: async ({ params, platform }) => {
		await deleteProduct(platform.env.DB, params.id);
		throw redirect(303, '/shop/edit/products');
	}
};
