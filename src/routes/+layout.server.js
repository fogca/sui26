import { DEFAULT_LANG } from '$lib/i18n.js';

/** The site is served in one language's URLs; the pages carry both languages
 *  themselves. Kept so t() has something to read rather than every page
 *  importing the constant. */
export function load() {
	return { lang: DEFAULT_LANG };
}
