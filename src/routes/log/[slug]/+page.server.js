import { error } from '@sveltejs/kit';
import { getPublished } from '$lib/log/store.js';

export async function load({ params, platform }) {
	const post = await getPublished(platform.env.DB, params.slug);
	if (!post) {
		throw error(404, 'Not found');
	}
	return { post };
}
