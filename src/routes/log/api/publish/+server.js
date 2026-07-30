import { json, error } from '@sveltejs/kit';
import { saveDraft, publish } from '$lib/log/store.js';

export async function POST({ request, platform }) {
	const body = await request.json();
	const { slug, title, date, blocks } = body ?? {};
	if (!slug) throw error(400, 'invalid payload');
	// Persist the latest edits first, then publish draft -> published.
	if (Array.isArray(blocks)) {
		await saveDraft(platform.env.DB, slug, { title: title ?? '', date: date ?? '', blocks });
	}
	await publish(platform.env.DB, slug);
	return json({ ok: true });
}
