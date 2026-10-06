<script>
	import { page } from '$app/stores';
	import { fade } from 'svelte/transition';
	import { afterNavigate } from '$app/navigation';
	import { browser } from '$app/environment';
	import { splitLang } from '$lib/i18n.js';

	// The page is always rendered — including on the server, so crawlers and
	// link previews see real content in both languages. Nothing gates the
	// markup on webfont load; font-display: swap carries it.

	// The "II" direction is scoped to .ii, and only the public pages get it.
	// The back office keeps base.css + admin.css, which is why this is decided
	// here rather than by loading ii.css unscoped.
	const ADMIN =
		/^\/shop\/edit(\/|$)|^\/log\/(edit|new|login)(\/|$)|^\/log\/[^/]+\/edit\/?$/;
	$: isAdmin = ADMIN.test(splitLang($page.url.pathname).path);

	// TypeSquare loads via a <script> in app.html, so the global may not exist
	// yet when navigation callbacks fire. Poll briefly, then run.
	// The v3 loader exposes `TypeSquareJS` (older docs say `Ts`), so accept
	// either and call whichever rescan method that build provides.
	function whenTypeSquareReady(cb, timeoutMs = 6000) {
		const startedAt = performance.now();
		const poll = () => {
			const ts = window.TypeSquareJS || window.Ts;
			if (ts && (typeof ts.loadFont === 'function' || typeof ts.loadFontAsync === 'function')) {
				cb(ts);
				return;
			}
			if (performance.now() - startedAt > timeoutMs) return; // give up silently
			setTimeout(poll, 60);
		};
		poll();
	}

	afterNavigate((nav) => {
		// SvelteKit navigates client-side, so TypeSquare never re-scans the new
		// DOM on its own. Re-run the scan so newly rendered characters get their
		// subset. (Only the back office still uses Akashi; the public pages are
		// on the direction's own stack.)
		if (!browser) return;
		if (nav.type === 'enter') return; // first paint is handled by the loader itself
		whenTypeSquareReady((ts) => {
			if (typeof ts.loadFont === 'function') ts.loadFont();
			else ts.loadFontAsync();
		});
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
