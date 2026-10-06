<script>
	// log — a single entry, in the "II" direction. The same surface and mark
	// chrome as About; the body is held to the shared measure (348px / 46ch)
	// so the Japanese lines stay readable at the direction's 11 / 12.5px.
	//
	// The blocks themselves are drawn by the shared BlockRenderer, which the
	// inline editor also uses; it carries its own .ii-only overrides so the
	// admin view keeps the base.css look.
	import Photo from '$lib/ii/Photo.svelte';
	import Chrome from '$lib/ii/Chrome.svelte';
	import Foot from '$lib/ii/Foot.svelte';
	import BlockRenderer from '$lib/log/BlockRenderer.svelte';
	import { page } from '$app/stores';
	import { translator, localizePath, splitLang } from '$lib/i18n.js';
	export let data;

	const SITE = 'https://sui-sari.hi-843.workers.dev';

	$: t = translator(data.lang);
	$: path = (q) => localizePath(q, data.lang);
	$: jaPath = splitLang($page.url.pathname).path;
	$: enPath = localizePath(jaPath, 'en');
</script>

<svelte:head>
	<title>{data.post.title} — {t('common.siteName')}</title>
	<link rel="alternate" hreflang="ja" href="{SITE}{jaPath}" />
	<link rel="alternate" hreflang="en" href="{SITE}{enPath}" />
</svelte:head>

<div class="ii-page">
	<div class="ii-surface">
		<Photo sp={{ w: 2.2723, x: 0, y: 0 }} pc={{ w: 1.5, x: 0, y: 0 }} />
	</div>
	<Chrome variant="inner" tone="ink" />

	<main class="ii-main">
		<article class="ii-measure">
			<time class="ii-label date">{data.post.date}</time>

			{#if data.lang === 'en'}
				<p class="ii-body note" lang="en">{t('log.jaOnly')}</p>
			{/if}

			<!-- entry body is authored in Japanese; shown as written in both languages -->
			<div class="body" lang="ja">
				<BlockRenderer blocks={data.post.blocks} />
			</div>

			<a class="ii-body back" href={path('/log')} lang="en">{t('log.backToLog')}</a>
		</article>
	</main>

	<Foot />
</div>

<style>
	.date {
		display: block;
	}
	/* note shown above Japanese-only body copy on the English page */
	.note {
		margin-top: 18px;
		color: var(--ii-mute);
	}
	.body {
		margin-top: 40px;
	}
	.back {
		display: inline-block;
		margin-top: 72px;
		color: var(--ii-mute);
	}

	@media screen and (min-width: 720px) {
		.note {
			margin-top: 22px;
		}
		.body {
			margin-top: 56px;
		}
		.back {
			margin-top: 96px;
		}
	}
</style>
