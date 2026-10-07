<script>
	// Home — Figma 128:264, opened by 128:260.
	//
	// One screen, no scroll: the water field full bleed, the studio's line in
	// white over it, and nothing else.
	//
	// The opening runs in three movements and this page carries two of them.
	// Opening.svelte owns only the mark and the clock; it hands back a phase and
	// every visual change below is a CSS transition keyed to it:
	//
	//   mark   white ground, the symbol swaying, nothing else on the page
	//   text   the headline arrives word by word, dark on that white ground
	//   field  the water rises behind it and the words turn white with it,
	//          and the chrome, the services line and the signature follow
	//
	// Frame measurements at 393 x 720: headline left 29 / top 295 / 32px,
	// services left 29 / top 377 / 12px / 297 wide, signature left 21 / top 688.
	import Surface from '$lib/ii/Surface.svelte';
	import Chrome from '$lib/ii/Chrome.svelte';
	import Opening from '$lib/ii/Opening.svelte';
	import { translator } from '$lib/i18n.js';

	export let data;

	const SITE = 'https://sui-sari.hi-843.workers.dev';

	$: t = translator(data.lang);

	/** pre | mark | text | field | done — set by Opening. 'pre' is what the
	 *  server renders; the page's CSS only acts on it while app.html has not
	 *  flagged the opening as already seen. */
	let phase = 'pre';

	// The headline, split to the letter so each one can be moved and recoloured
	// on its own. The cascade index runs across both lines rather than
	// restarting, so the stagger reads as one movement left to right.
	//
	// Letters are grouped back into words because an inline-block per letter is
	// its own break opportunity — without the wrapper a narrow screen can break
	// a line in the middle of a word.
	const HEAD_TEXT = 'Olfactory artwork / Phenomenon';
	let n = 0;
	const HEAD = [['Olfactory', 'artwork', '/'], ['Phenomenon']].map((line) =>
		line.map((word) => [...word].map((ch) => ({ ch, i: n++ })))
	);
</script>

<svelte:head>
	<title>{t('common.siteName')}</title>
	<link rel="canonical" href="{SITE}/" />
	<!-- without JS no phase ever arrives, so the page must start at the end of
	     the opening rather than at the beginning of it -->
	<noscript>
		{@html '<style>.top .late,.top .head .c{opacity:1 !important;transform:none !important;color:inherit !important}.surface{opacity:1 !important}</style>'}
	</noscript>
</svelte:head>

<div class="top on-field" data-op={phase}>
	<Surface />
	<Opening on:phase={(e) => (phase = e.detail)} />

	<Chrome tone="over" />

	<div class="copy">
		<!-- the letters are decoration to a screen reader; the label is the line -->
		<h1 class="head" lang="en" aria-label={HEAD_TEXT}>
			{#each HEAD as line, li}{#each line as word, wi}<span class="word"
					>{#each word as c}<span class="c" style="--i:{c.i}">{c.ch}</span>{/each}</span
				>{#if wi < line.length - 1}{' '}{/if}{/each}{#if li < HEAD.length - 1}<br />{/if}{/each}
		</h1>
		<p class="services late" lang="en">
			Perfumery / Distilled laboratory / Ambient scent /<br class="wide" />
			Elements / OEM for natural cosmetics<br />in Nagano Japan
		</p>
	</div>

	<p class="sign late" lang="en">scent studio</p>
</div>

<style>
	.top {
		position: relative;
		width: 100%;
		height: 100vh;
		height: 100dvh;
		overflow: hidden;
		/* the ground the opening plays on, behind the water */
		background: #fff;
		/* .ii .on-field has already turned --ii-ink white for this page, so the
		   opening cannot ask for the ink by that name. This is ii.css's own
		   --ii-ink value. */
		--op-ink: #536774;
	}

	/* ─── the opening ────────────────────────────────────────────────
	   Every rule below is gated on the absence of data-op-seen, which app.html
	   writes before first paint. A reader who has already seen the opening is
	   therefore never shown a frame of it, even though the phases still run. */

	.top :global(.surface) {
		transition: opacity 2.2s ease;
	}
	.top :global(.chrome) {
		transition: opacity 1.8s ease;
	}
	.late {
		transition: opacity 1.8s ease;
	}
	/* holds a word together: every letter below is an inline-block and so a
	   break opportunity of its own */
	.head .word {
		display: inline-block;
	}
	.head .c {
		/* inline-block so the letters have something to move */
		display: inline-block;
		/* The colour is paced to the water's own 2.2s rather than run ahead of
		   it: finishing early left the letters fully white while the field was
		   only half up, which on this palette is white type on an almost white
		   ground. */
		transition:
			opacity 1.1s ease,
			transform 1.1s cubic-bezier(0.2, 0.7, 0.3, 1),
			color 2s ease;
		/* the stagger — it carries the entrance and, later, the turn to white,
		   so both read as the same movement crossing the line */
		transition-delay: calc(var(--i) * 38ms);
	}

	/* the water is down, and so is everything that belongs on top of it */
	:global(html:not([data-op-seen]))
		.top:is([data-op='pre'], [data-op='mark'], [data-op='text'])
		:global(.surface) {
		opacity: 0;
	}
	:global(html:not([data-op-seen]))
		.top:is([data-op='pre'], [data-op='mark'], [data-op='text'])
		:global(.chrome),
	:global(html:not([data-op-seen]))
		.top:is([data-op='pre'], [data-op='mark'], [data-op='text'])
		.late {
		opacity: 0;
	}

	/* the headline waits for its own movement, one step ahead of the rest */
	:global(html:not([data-op-seen])) .top:is([data-op='pre'], [data-op='mark']) .head .c {
		opacity: 0;
		transform: translateX(-18px);
	}
	/* dark on the white ground, until the water is there to be white against */
	:global(html:not([data-op-seen])) .top:is([data-op='mark'], [data-op='text']) .head .c {
		color: var(--op-ink);
	}

	/* ─── the page ───────────────────────────────────────────────── */

	.copy {
		position: absolute;
		left: 29px;
		/* 295 / 720 */
		top: 41vh;
		z-index: 2;
	}
	.head {
		font-weight: var(--ii-thin);
		font-size: 32px;
		line-height: 1.1;
		letter-spacing: 0.03em;
	}
	.services {
		margin-top: 18px;
		max-width: 297px;
		font-weight: var(--ii-thin);
		font-size: 12px;
		line-height: 1.4;
		letter-spacing: 0.03em;
	}
	/* on a phone the line wraps to its own width; the break is only there to
	   hold the second line together on a wide screen */
	.services br.wide {
		display: none;
	}

	.sign {
		position: absolute;
		left: 21px;
		bottom: calc(20px + env(safe-area-inset-bottom));
		z-index: 2;
		font-weight: var(--ii-thin);
		font-size: 12px;
		line-height: 1.2;
		letter-spacing: 0.02em;
	}

	@media screen and (min-width: 720px) {
		.copy {
			left: 4.4vw;
			top: 44vh;
		}
		.head {
			font-size: 54px;
		}
		.services {
			margin-top: 24px;
			max-width: 420px;
			font-size: 13px;
		}
		.services br.wide {
			display: inline;
		}
		.sign {
			left: 4.4vw;
			bottom: 30px;
			font-size: 13px;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.head .c,
		.late,
		.top :global(.surface),
		.top :global(.chrome) {
			transition: none;
		}
	}
</style>
