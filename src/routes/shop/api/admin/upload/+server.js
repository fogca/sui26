import { json, error } from '@sveltejs/kit';

const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

// Admin: upload a product image to R2 under shop/<product-slug>/.
export async function POST({ request, platform }) {
	const form = await request.formData();
	const file = form.get('file');
	const slug = String(form.get('slug') ?? 'misc').replace(/[^a-z0-9-]/g, '') || 'misc';
	if (!file || typeof file === 'string') throw error(400, 'no file');

	const ext = EXT[file.type];
	if (!ext) throw error(415, 'unsupported type');

	const key = `shop/${slug}/${crypto.randomUUID()}.${ext}`;
	await platform.env.BUCKET.put(key, await file.arrayBuffer(), {
		httpMetadata: { contentType: file.type }
	});
	return json({ src: `/media/${key}` });
}
