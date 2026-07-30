import { error } from '@sveltejs/kit';
import { getForEdit } from '$lib/log/store.js';

export async function load({ params, platform }) {
	const post = await getForEdit(platform.env.DB, params.slug);
	if (!post) throw error(404, 'Not found');
	return { post };
}
