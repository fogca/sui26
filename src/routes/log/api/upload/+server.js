import { json, error } from '@sveltejs/kit';

const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

// Accept a single image file (multipart) and store it in R2 under
// log/<slug>/<uuid>.<ext>. Returns the public path served by /media/[...key].
export async function POST({ request, platform }) {
	const form = await request.formData();
	const file = form.get('file');
	const slug = String(form.get('slug') ?? 'misc');
	if (!file || typeof file === 'string') throw error(400, 'no file');

	const ext = EXT[file.type];
	if (!ext) throw error(415, 'unsupported type');

	const key = `log/${slug}/${crypto.randomUUID()}.${ext}`;
	const buf = await file.arrayBuffer();
	await platform.env.BUCKET.put(key, buf, {
		httpMetadata: { contentType: file.type }
	});

	return json({ src: `/media/${key}` });
}
