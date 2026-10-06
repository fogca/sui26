/** Expose the language (resolved in hooks.server.js) to every page. */
export function load({ locals }) {
	return { lang: locals.lang ?? 'ja' };
}
