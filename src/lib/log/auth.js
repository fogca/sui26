// Stateless editor auth: the session cookie holds an HMAC of a fixed marker
// keyed by the editor password. It can't be forged without the password, and
// needs no server-side session store.

const MARKER = 'log-editor-v1';

async function hmac(value, secret) {
	const enc = new TextEncoder();
	const key = await crypto.subtle.importKey(
		'raw',
		enc.encode(secret),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign']
	);
	const sig = await crypto.subtle.sign('HMAC', key, enc.encode(value));
	return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

/**
 * Editor password from env. NO fallback: if unset, auth fails closed
 * (login rejects, sessions never verify). Local dev supplies it via .dev.vars.
 */
export function editorPassword(platform) {
	return platform?.env?.EDITOR_PASSWORD ?? '';
}

/** Token to store in the session cookie after a correct password. */
export function makeToken(secret) {
	return hmac(MARKER, secret);
}

/** Verify a cookie token against the password. Fails closed without a secret. */
export async function verifyToken(token, secret) {
	if (!token || !secret) return false;
	return token === (await makeToken(secret));
}

export const SESSION_COOKIE = 'log_session';
