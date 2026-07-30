import { json, error } from '@sveltejs/kit';
import { unpublish } from '$lib/log/store.js';

export async function POST({ request, platform }) {
	const { slug } = (await request.json()) ?? {};
	if (!slug) throw error(400, 'invalid payload');
	await unpublish(platform.env.DB, slug);
	return json({ ok: true });
}
