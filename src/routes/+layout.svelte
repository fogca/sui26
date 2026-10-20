<script>
	import { page } from '$app/stores';
	import { fade } from 'svelte/transition';
	import { beforeNavigate, afterNavigate, goto } from '$app/navigation';
	import { onDestroy } from 'svelte';
	import { browser } from '$app/environment';
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
	$: isAdmin = ADMIN.test($page.url.pathname);

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

	// ─── the page change ───────────────────────────────────────────────
	// The scrim has to be all the way down BEFORE the page swaps, or the next
	// page is seen arriving through a half-drawn curtain and the whole thing
	// reads as a fade-in after the fact. A navigation inside the app is
	// instant, so the only way to order it is to hold the navigation up: the
	// first one is cancelled, the scrim is drawn, and then the same navigation
	// is made again — and that second one is let through.
	//
	// Back and forward are not cancelled. The URL has already moved by the time
	// this runs, and cancelling would leave the history out of step with the
	// page; those get the scrim without the hold.
	const DRAW = 500; // matches the CSS below
	let veiled = false;
	let reissued = false;
	let veilTimer = 0;

	beforeNavigate((nav) => {
		if (!browser) return;
		if (nav.type === 'leave' || !nav.to) return;
		if (nav.to.url.pathname === nav.from?.url.pathname) return;

		// our own second attempt — let it go
		if (reissued) {
			reissued = false;
			return;
		}

		if (nav.type === 'link' || nav.type === 'goto') {
			const to = nav.to.url.href;
			nav.cancel();
			veiled = true;
			clearTimeout(veilTimer);
			veilTimer = setTimeout(() => {
				reissued = true;
				goto(to);
			}, DRAW);
			return;
		}

		veiled = true;
	});

	afterNavigate((nav) => {
		if (!browser || !veiled) return;
		if (nav.type === 'enter') {
			veiled = false;
			return;
		}
		// Lift once the new page is under it. SvelteKit has already rendered it
		// by the time this runs, so this is only long enough to be painted —
		// and it is a timer rather than a pair of frames because frames stop in
		// a tab nobody is looking at, and a scrim that never lifts is the one
		// failure here that would be unrecoverable.
		clearTimeout(veilTimer);
		veilTimer = setTimeout(() => (veiled = false), 60);
	});

	onDestroy(() => {
		if (browser) clearTimeout(veilTimer);
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
		<div class="ii">
			<slot />
		</div>
	{/key}

	<!-- The page change, read off cathydolle.com (2026-10-20): a white scrim at
	     nine tenths draws over the view and lifts off the next one. It sits
	     under the chrome, so the header stays crisp across the change while
	     everything below it is veiled, and it is translucent, so whatever is
	     beneath keeps moving rather than being replaced by a blank card. -->
	<div class="veil" class:on={veiled} aria-hidden="true"></div>
{/if}

<!-- outside .ii on purpose: the direction's type rules must not reach it -->
{#if tuning}
	<Tune />
{/if}

<style>
	.veil {
		position: fixed;
		inset: 0;
		/* over the page, under the chrome (10) and the opening (40) */
		z-index: 9;
		background: rgba(255, 255, 255, 0.9);
		opacity: 0;
		pointer-events: none;
		transition: opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1);
	}
	.veil.on {
		opacity: 1;
	}
	@media (prefers-reduced-motion: reduce) {
		.veil {
			transition: none;
		}
	}
</style>
