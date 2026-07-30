import { json, error } from '@sveltejs/kit';
import { deletePage } from '$lib/log/store.js';

// Delete a page and purge its uploaded media under log/<slug>/ from R2.
export async function POST({ request, platform }) {
	const { slug } = (await request.json()) ?? {};
	if (!slug) throw error(400, 'invalid payload');

	const bucket = platform.env.BUCKET;
	let cursor;
	do {
		const list = await bucket.list({ prefix: `log/${slug}/`, cursor });
		if (list.objects.length) {
			await bucket.delete(list.objects.map((o) => o.key));
		}
		cursor = list.truncated ? list.cursor : undefined;
	} while (cursor);

	await deletePage(platform.env.DB, slug);
	return json({ ok: true });
}
