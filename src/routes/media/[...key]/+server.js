import { error } from '@sveltejs/kit';

// Stream an object out of R2. Works identically in local (Miniflare) and prod.
export async function GET({ params, platform, setHeaders }) {
	const obj = await platform.env.BUCKET.get(params.key);
	if (!obj) throw error(404, 'not found');

	setHeaders({
		'Content-Type': obj.httpMetadata?.contentType ?? 'application/octet-stream',
		'Cache-Control': 'public, max-age=31536000, immutable',
		etag: obj.httpEtag
	});
	return new Response(obj.body);
}
