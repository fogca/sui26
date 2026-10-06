<script>
	// Home — Figma 128:264, opened by 128:260.
	//
	// One screen, no scroll: the water field full bleed, the studio's line in
	// white over it, and nothing else. The opening is the same field with only
	// the mark on it, so the surface never cuts between the two.
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

	let revealed = false;
</script>

<svelte:head>
	<title>{t('common.siteName')}</title>
	<link rel="alternate" hreflang="ja" href="{SITE}/" />
	<link rel="alternate" hreflang="en" href="{SITE}/en" />
	<!-- without JS the opening never finishes, so the page must start visible -->
	<noscript>
		{@html '<style>.reveal{opacity:1 !important}</style>'}
	</noscript>
</svelte:head>

<div class="top">
	<Surface />
	<Opening on:done={() => (revealed = true)} />

	<div class="reveal" class:is-in={revealed}>
		<Chrome tone="over" />

		<div class="copy">
			<h1 class="head" lang="en">Olfactory artwork /<br />Phenomenon</h1>
			<p class="services" lang="en">
				Perfumery / Distilled laboratory / Ambient scent / Elements / OEM for natural
				cosmetics<br />in Nagano Japan
			</p>
		</div>

		<p class="sign" lang="en">scent studio</p>
	</div>
</div>

<style>
	.top {
		position: relative;
		width: 100%;
		height: 100vh;
		height: 100dvh;
		overflow: hidden;
		color: #fff;
	}

	/* Hidden before the opening has played — set in CSS, from a flag app.html
	   writes before first paint, so a returning reader never sees it flash. */
	.reveal {
		transition: opacity 1.2s ease;
	}
	:global(html:not([data-op-seen])) .reveal:not(.is-in) {
		opacity: 0;
	}

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
		.sign {
			left: 4.4vw;
			bottom: 30px;
			font-size: 13px;
		}
	}
</style>
