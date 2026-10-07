<script>
	// log — index, in the "II" direction. Same surface and mark chrome as the
	// About frame; the entry list is a column of hairline-separated rows, each
	// a small 4:5 plate, the date as a label and the Japanese title beside it.
	//
	// Presentation only: the load contract, the keyed each block, the empty
	// state and the English-only "Japanese entries" notice are untouched.
	import Surface from '$lib/ii/Surface.svelte';
	import { BREATH } from '$lib/ii/surface.js';
	import Chrome from '$lib/ii/Chrome.svelte';
	import Foot from '$lib/ii/Foot.svelte';
	import { page } from '$app/stores';
	import {translator} from '$lib/i18n.js';
	export let data;

	const SITE = 'https://sui-sari.hi-843.workers.dev';

	$: t = translator(data.lang);
</script>

<svelte:head>
	<title>{t('log.title')} — {t('common.siteName')}</title>
	<link rel="canonical" href="{SITE}{$page.url.pathname}" />
</svelte:head>

<div class="ii-page">
	<Surface study={BREATH} />
	<Chrome tone="ink" />

	<main class="ii-main">
		<h1 class="ii-display" lang="en">{t('log.title')}</h1>


		<ul class="list">
			{#each data.posts as post (post.slug)}
				<li class="row">
					<a href={`/log/${post.slug}`}>
						{#if post.cover}
							<div class="thumb"><img src={post.cover} alt="" /></div>
						{/if}
						<div class="meta">
							<time class="ii-label date">{post.date}</time>
							<!-- entry titles are written in Japanese only -->
							<span class="title" lang="ja">{post.title}</span>
						</div>
					</a>
				</li>
			{/each}
		</ul>

		{#if data.posts.length === 0}
			<p class="ii-body empty" lang={data.lang}>{t('log.empty')}</p>
		{/if}
	</main>

	<Foot />
</div>

<style>
	h1 {
		margin-bottom: 44px;
	}

	.empty {
		color: var(--ii-mute);
	}

	.row {
		border-top: 1px solid var(--ii-rule-soft);
	}
	.row:last-child {
		border-bottom: 1px solid var(--ii-rule-soft);
	}
	/* the plate column is held open whether or not the entry has a cover, so
	   the dates stay on one line down the list */
	.row a {
		display: grid;
		grid-template-columns: 64px minmax(0, 1fr);
		gap: 0 16px;
		align-items: start;
		padding: 18px 0;
	}
	.thumb {
		aspect-ratio: 4 / 5;
		overflow: hidden;
	}
	.thumb img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.meta {
		grid-column: 2;
	}
	.date {
		display: block;
	}
	.title {
		display: block;
		margin-top: 8px;
		font-size: 13px;
	}

	@media screen and (min-width: 720px) {
		h1 {
			margin-bottom: 64px;
		}
		.list {
			max-width: 640px;
		}
		.row a {
			grid-template-columns: 88px minmax(0, 1fr);
			gap: 0 24px;
			padding: 24px 0;
		}
		.title {
			font-size: 15px;
		}
	}
</style>
