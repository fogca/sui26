import { fail, redirect } from '@sveltejs/kit';
import { createProduct, productSlugExists } from '$lib/shop/store.js';
import { parseProductForm } from '$lib/shop/validate.js';

export const actions = {
	default: async ({ request, platform }) => {
		const { error, values } = parseProductForm(await request.formData());
		if (error) return fail(400, { error, values });
		if (await productSlugExists(platform.env.DB, values.slug)) {
			return fail(400, { error: 'その slug は既に使われています', values });
		}
		await createProduct(platform.env.DB, values);
		throw redirect(303, '/shop/edit/products');
	}
};
