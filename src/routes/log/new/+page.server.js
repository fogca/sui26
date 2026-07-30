import { fail, redirect } from '@sveltejs/kit';
import { createPage, slugExists } from '$lib/log/store.js';

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const actions = {
	default: async ({ request, platform }) => {
		const form = await request.formData();
		const slug = String(form.get('slug') ?? '').trim();
		const title = String(form.get('title') ?? '').trim();

		if (!SLUG_RE.test(slug)) {
			return fail(400, { error: 'slug は半角英数字とハイフンのみ（例: spring-note）', slug, title });
		}
		if (await slugExists(platform.env.DB, slug)) {
			return fail(400, { error: 'その slug は既に使われています', slug, title });
		}

		await createPage(platform.env.DB, { slug, title });
		throw redirect(303, `/log/${slug}/edit`);
	}
};
