import { json, error } from '@sveltejs/kit';
import { saveDraft } from '$lib/log/store.js';

export async function POST({ request, platform }) {
	const body = await request.json();
	const { slug, title, date, blocks } = body ?? {};
	if (!slug || !Array.isArray(blocks)) {
		throw error(400, 'invalid payload');
	}
	await saveDraft(platform.env.DB, slug, {
		title: title ?? '',
		date: date ?? '',
		blocks
	});
	return json({ ok: true });
}
