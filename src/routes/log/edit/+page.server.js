import { listAll } from '$lib/log/store.js';

export async function load({ platform }) {
	const pages = await listAll(platform.env.DB);
	return { pages };
}
