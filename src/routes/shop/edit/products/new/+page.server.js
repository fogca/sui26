import { fail, redirect } from '@sveltejs/kit';
import { createProduct, listCategories, productSlugExists } from '$lib/shop/store.js';
import { parseProductForm } from '$lib/shop/validate.js';

export async function load({ platform }) {
	// existing categories feed the datalist on the form
	const categories = await listCategories(platform.env.DB);
	return { categories };
}

export const actions = {
	default: async ({ request, platform }) => {
		const { error, errors, values } = parseProductForm(await request.formData());
		if (error) return fail(400, { error, errors, values });
		if (await productSlugExists(platform.env.DB, values.slug)) {
			return fail(400, {
				error: 'その slug は既に使われています',
				errors: { slug: 'その slug は既に使われています' },
				values
			});
		}
		const id = await createProduct(platform.env.DB, values);
		// land on the product's own edit screen so the result is visible and
		// the next edit needs no extra navigation
		throw redirect(303, `/shop/edit/products/${id}?created=1`);
	}
};
