import { redirect } from '@sveltejs/kit';
import { editorPassword, verifyToken, SESSION_COOKIE } from '$lib/log/auth.js';

// Gate the editor surfaces:
// - log:  /log/edit, /log/new, /log/<slug>/edit, /log/api/*
// - shop: /shop/edit* (dashboard), /shop/api/admin/*
// Public shop APIs (/shop/api/checkout, /shop/api/webhook, /shop/api/mock-pay,
// /shop/api/catalog) stay open — buyers and Stripe need them.
function isProtected(pathname) {
	if (pathname === '/log/login') return false;
	return (
		pathname.startsWith('/log/edit') ||
		pathname.startsWith('/log/new') ||
		pathname.startsWith('/log/api') ||
		(pathname.startsWith('/log/') && pathname.endsWith('/edit')) ||
		pathname.startsWith('/shop/edit') ||
		pathname.startsWith('/shop/api/admin')
	);
}

export async function handle({ event, resolve }) {
	// The router matches routes on DECODED segments, so the gate must compare
	// decoded paths too — otherwise /shop/%65dit would slip past startsWith().
	let pathname;
	try {
		pathname = decodeURIComponent(event.url.pathname);
	} catch {
		return new Response('Bad Request', { status: 400 });
	}

	if (isProtected(pathname)) {
		const token = event.cookies.get(SESSION_COOKIE);
		const ok = await verifyToken(token, editorPassword(event.platform));
		if (!ok) {
			if (pathname.startsWith('/log/api') || pathname.startsWith('/shop/api')) {
				return new Response('Unauthorized', { status: 401 });
			}
			throw redirect(302, '/log/login?next=' + encodeURIComponent(pathname));
		}
	}
	return resolve(event);
}
