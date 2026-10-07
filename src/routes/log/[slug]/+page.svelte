<script>
	// log — a single entry, in the "II" direction. The same surface and mark
	// chrome as About; the body is held to the shared measure (348px / 46ch)
	// so the Japanese lines stay readable at the direction's 11 / 12.5px.
	//
	// The blocks themselves are drawn by the shared BlockRenderer, which the
	// inline editor also uses; it carries its own .ii-only overrides so the
	// admin view keeps the base.css look.
	import Surface from '$lib/ii/Surface.svelte';
	import { BREATH } from '$lib/ii/surface.js';
	import Chrome from '$lib/ii/Chrome.svelte';
	import Foot from '$lib/ii/Foot.svelte';
	import BlockRenderer from '$lib/log/BlockRenderer.svelte';
	import { page } from '$app/stores';
	import {translator} from '$lib/i18n.js';
	export let data;

	const SITE = 'https://sui-sari.hi-843.workers.dev';

	$: t = translator(data.lang);
</script>

<svelte:head>
	<title>{data.post.title} — {t('common.siteName')}</title>
	<link rel="canonical" href="{SITE}{$page.url.pathname}" />
</svelte:head>

<div class="ii-page">
	<Surface study={BREATH} />
	<Chrome tone="ink" />

	<main class="ii-main">
		<article class="ii-measure">
			<time class="ii-label date">{data.post.date}</time>


			<!-- entry body is authored in Japanese; shown as written in both languages -->
			<div class="body" lang="ja">
				<BlockRenderer blocks={data.post.blocks} />
			</div>

			<a class="ii-body back" href={'/log'} lang="en">{t('log.backToLog')}</a>
		</article>
	</main>

	<Foot />
</div>

<style>
	.date {
		display: block;
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
		.body {
			margin-top: 56px;
		}
		.back {
			margin-top: 96px;
		}
	}
</style>
