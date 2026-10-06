<script>
	import { page } from '$app/stores';
	import { contactMailto } from '$lib/works.js';
	import { localizePath, splitLang } from '$lib/i18n.js';

	$: lang = $page.data?.lang ?? 'ja';
	/** Nav links keep the reader in their current language. */
	$: path = (p) => localizePath(p, lang);
	/** The switch stays on the same page, only swapping the language prefix. */
	$: contactHref = contactMailto(lang);
	$: otherLangHref = localizePath(splitLang($page.url.pathname).path, lang === 'ja' ? 'en' : 'ja');

	/** Remember the pick for this tab session, so the pre-paint script in
	 *  app.html doesn't send them back to the other language on the next visit
	 *  to the bare entry point. Mirrors OTIF's sessionStorage behaviour. */
	function rememberLang() {
		try {
			sessionStorage.setItem('sui-lang', lang === 'ja' ? 'en' : 'ja');
		} catch (e) {
			// private mode / storage disabled — the URL still carries the language
		}
	}
</script>

<!-- Nav labels are English-only, so they carry lang="en" and render in Garamond
     rather than Akashi's Latin. -->
<nav class="site-menu" lang="en">
	<a href={path('/shop')}>Fragrance</a>
	<a href={path('/works')}>Works</a>
	<a href={path('/about')}>About</a>
	<a href={contactHref} target="_blank" rel="noopener">Contact</a>
	<a
		class="lang"
		href={otherLangHref}
		hreflang={lang === 'ja' ? 'en' : 'ja'}
		on:click={rememberLang}
	>
		{lang === 'ja' ? 'EN' : '日本語'}
	</a>
</nav>

<style>
	.site-menu {
		position: fixed;
		top: calc(2.5rem + env(safe-area-inset-top));
		right: var(--padding);
		z-index: 20;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.6rem;
	}
	.site-menu a {
		font-size: 1.1rem;
		letter-spacing: 0.05em;
		color: var(--textColor);
	}
	/* the language switch sits slightly apart from the section links */
	.site-menu .lang {
		color: var(--subColor);
		font-size: 1rem;
	}

	@media screen and (min-width: 720px) {
		.site-menu {
			top: 4rem;
			right: var(--pcPadding);
			flex-direction: row;
			gap: 2.2rem;
		}
	}
</style>
