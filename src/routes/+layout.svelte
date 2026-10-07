<script>
	import { page } from '$app/stores';
	import { fade } from 'svelte/transition';
	import { afterNavigate } from '$app/navigation';
	import { browser } from '$app/environment';
	import { splitLang } from '$lib/i18n.js';
	import Tune from '$lib/ii/Tune.svelte';

	// ?tune mounts the colour bar — on the deployed site too, so the palette can
	// be judged on an actual phone. It is remembered for the rest of the tab
	// session, because the site's own links carry no query and the bar is
	// useless if it falls off at the first navigation. ?tune=off puts it away.
	// Client only: it has no business in the HTML a crawler is served.
	const TUNE = 'sui-tune-on';
	let tuning = false;

	$: if (browser) {
		const q = $page.url.searchParams.get('tune');
		try {
			if (q === 'off') sessionStorage.removeItem(TUNE);
			else if (q !== null) sessionStorage.setItem(TUNE, '1');
			tuning = sessionStorage.getItem(TUNE) === '1';
		} catch {
			tuning = q !== null && q !== 'off';
		}
	}

	// The page is always rendered — including on the server, so crawlers and
	// link previews see real content in both languages. Nothing gates the
	// markup on webfont load; font-display: swap carries it.

	// The "II" direction is scoped to .ii, and only the public pages get it.
	// The back office keeps base.css + admin.css, which is why this is decided
	// here rather than by loading ii.css unscoped.
	const ADMIN =
		/^\/shop\/edit(\/|$)|^\/log\/(edit|new|login)(\/|$)|^\/log\/[^/]+\/edit\/?$/;
	$: isAdmin = ADMIN.test(splitLang($page.url.pathname).path);

	// Akashi is delivered by TypeSquare as a dynamic subset: the loader scans
	// the DOM once, then injects an @font-face whose URL encodes exactly the
	// characters it found. After a client-side navigation that URL is stale, so
	// any Japanese character the first page did not contain has no glyph and
	// falls back — which is why a reload used to fix it.
	//
	// There is no rescan to call. `window.TypeSquareJS` is a configuration
	// object (loadFontAsync / onFontLoaded / querySelector), not an API; the
	// `loadFont()` this used to poll for never existed, so the old hook sat in a
	// six-second poll and gave up silently every time. Re-running the loader is
	// what works — verified in production: before, a Japanese run measured
	// identically to the bare fallback; after, it does not.
	let rescanning = false;

	function rescanTypeSquare() {
		if (rescanning) return;
		const current = document.querySelector('script[src*="typesquare.com"]');
		if (!current) return;
		rescanning = true;
		const src = current.src;
		current.remove();
		const next = document.createElement('script');
		next.src = src;
		next.charset = 'utf-8';
		next.onload = next.onerror = () => (rescanning = false);
		document.head.appendChild(next);
		// Each run leaves its own @font-face behind. Only the last one declared
		// is ever used and the others are never fetched, so they cost nothing
		// worth a riskier cleanup mid-render.
	}

	afterNavigate((nav) => {
		if (!browser) return;
		if (nav.type === 'enter') return; // the first paint is the loader's own
		rescanTypeSquare();
	});
</script>

<!-- Stylesheets and font loaders live in app.html so they start before first
     paint instead of after hydration. Do not re-add them here. -->

{#if isAdmin}
	{#key $page.url.pathname}
		<div in:fade={{ duration: 200 }}>
			<slot />
		</div>
	{/key}
{:else}
	{#key $page.url.pathname}
		<div class="ii" in:fade={{ duration: 1000 }}>
			<slot />
		</div>
	{/key}
{/if}

<!-- outside .ii on purpose: the direction's type rules must not reach it -->
{#if tuning}
	<Tune />
{/if}
