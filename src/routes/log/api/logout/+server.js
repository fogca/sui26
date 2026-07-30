import { SESSION_COOKIE } from '$lib/log/auth.js';

export async function POST({ cookies }) {
	cookies.delete(SESSION_COOKIE, { path: '/' });
	return new Response(null, { status: 204 });
}
