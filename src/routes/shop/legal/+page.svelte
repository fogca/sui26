<script>
	// 特定商取引法に基づく表記 — the statutory notice, rendered from the shop
	// settings. The disclosure itself is never translated: on the English page
	// the heading and the notice above it are English, then the Japanese
	// original stands as a sub-heading with the rows beneath it in Japanese.
	import Photo from '$lib/ii/Photo.svelte';
	import Chrome from '$lib/ii/Chrome.svelte';
	import Foot from '$lib/ii/Foot.svelte';
	import { page } from '$app/stores';
	import { translator, localizePath, splitLang } from '$lib/i18n.js';

	export let data;

	const SITE = 'https://sui-sari.hi-843.workers.dev';

	$: rows = data.rows;
	$: t = translator(data.lang);
	$: path = (q) => localizePath(q, data.lang);
	$: jaPath = splitLang($page.url.pathname).path;
	$: enPath = localizePath(jaPath, 'en');
</script>

<svelte:head>
	<title>{t('shop.legal')} — {t('common.siteName')}</title>
	<link rel="alternate" hreflang="ja" href="{SITE}{jaPath}" />
	<link rel="alternate" hreflang="en" href="{SITE}{enPath}" />
</svelte:head>

<div class="ii-page">
	<div class="ii-surface">
		<Photo sp={{ w: 2.2723, x: 0, y: 0 }} pc={{ w: 1.5, x: 0, y: 0 }} />
	</div>
	<Chrome variant="inner" tone="ink" />

	<main class="ii-main">
		{#if data.lang === 'en'}
			<h1 class="ii-display title" lang="en">{t('shop.legal')}</h1>
			<p class="ii-body notice" lang="en">{t('legal.jaNotice')}</p>
			<!-- The statutory notice is a legal disclosure: the Japanese original is
			     always shown, never an English rendering of it. -->
			<h2 class="ii-lead ja-title" lang="ja">特定商取引法に基づく表記</h2>
		{:else}
			<h1 class="ii-display title" lang="ja">特定商取引法に基づく表記</h1>
		{/if}

		{#if rows.length}
			<dl class="rows" lang="ja">
				{#each rows as row (row.label)}
					<div class="row">
						<dt class="ii-label">{row.label}</dt>
						<dd class="ii-jp">{row.value}</dd>
					</div>
				{/each}
			</dl>
		{:else}
			<p class="ii-body preparing" lang={data.lang}>{t('legal.preparing')}</p>
		{/if}

		<a class="ii-body back" href={path('/shop')} lang={data.lang}>{t('shop.backToShop')}</a>
	</main>

	<!-- the footer's legal link would point at this page -->
	<Foot legal={false} />
</div>

<style>
	/* The statutory title is a long sentence in both languages, so the display
	   line is given a measure and allowed to fall onto two or three lines
	   rather than run the width of the page. */
	.title {
		max-width: 348px;
	}
	.notice {
		max-width: 348px;
		margin-top: 20px;
		color: var(--ii-mute);
	}
	.ja-title {
		margin-top: 40px;
	}

	.rows {
		margin-top: 40px;
		border-top: 1px solid var(--ii-rule);
	}
	.row {
		padding: 16px 0;
		border-bottom: 1px solid var(--ii-rule-soft);
	}
	.row dt {
		margin-bottom: 7px;
	}
	.row dd {
		/* textarea input keeps its line breaks on the public page */
		white-space: pre-line;
	}

	.preparing {
		margin-top: 40px;
		color: var(--ii-mute);
	}
	.back {
		display: inline-block;
		margin-top: 64px;
		color: var(--ii-mute);
	}

	@media screen and (min-width: 720px) {
		.title {
			max-width: 620px;
		}
		.notice {
			max-width: 46ch;
			margin-top: 28px;
		}
		.ja-title {
			margin-top: 56px;
		}
		.rows {
			margin-top: 56px;
			max-width: 900px;
		}
		.row {
			display: grid;
			grid-template-columns: 200px minmax(0, 1fr);
			gap: 0 4vw;
			align-items: baseline;
			padding: 20px 0;
		}
		.row dt {
			margin-bottom: 0;
		}
		.preparing {
			margin-top: 56px;
		}
		.back {
			margin-top: 96px;
		}
	}
</style>
