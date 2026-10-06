import { splitLang } from '$lib/i18n.js';

/**
 * Universal reroute: /en/shop is served by the /shop route.
 * Keeping one route tree means every page is automatically bilingual — there is
 * no second copy of the site to keep in sync. The language itself is read back
 * out of the URL in hooks.server.js.
 */
export function reroute({ url }) {
	const { lang, path } = splitLang(url.pathname);
	if (lang === 'en') return path;
}
