import { listPublished } from '$lib/log/store.js';

export async function load({ platform }) {
	const posts = await listPublished(platform.env.DB);
	return { posts };
}
