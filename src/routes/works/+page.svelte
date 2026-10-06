<script>
	// Works — the collaboration index, in the "II" direction.
	//
	// The grid is the one the Top frame states for its project band: a 4:5
	// plate, then a caption row of a muted index and the credit in Japanese.
	// Here it runs the full deduped list on the About frame's pale surface,
	// which is the direction's inner-page ground.
	import { page } from '$app/stores';
	import Photo from '$lib/ii/Photo.svelte';
	import Chrome from '$lib/ii/Chrome.svelte';
	import Foot from '$lib/ii/Foot.svelte';
	import { works } from '$lib/works.js';
	import { translator, localizePath, splitLang } from '$lib/i18n.js';

	export let data;

	const SITE = 'https://sui-sari.hi-843.workers.dev';

	// same source list as the home intro loop, deduped by credit name for a
	// clean static index (home shows every image incl. repeats; here each
	// collaborator appears once)
	const seen = new Set();
	const items = works.filter((w) => (seen.has(w.text) ? false : seen.add(w.text)));

	$: t = translator(data.lang);
	$: jaPath = splitLang($page.url.pathname).path;
	$: enPath = localizePath(jaPath, 'en');
</script>

<svelte:head>
	<title>{t('works.title')} — {t('common.siteName')}</title>
	<link rel="alternate" hreflang="ja" href="{SITE}{jaPath}" />
	<link rel="alternate" hreflang="en" href="{SITE}{enPath}" />
</svelte:head>

<div class="ii-page">
	<div class="ii-surface">
		<Photo sp={{ w: 2.2723, x: 0, y: 0 }} pc={{ w: 1.5, x: 0, y: 0 }} />
	</div>
	<Chrome variant="inner" tone="ink" />

	<main class="ii-main">
		<!-- English-only heading -->
		<h1 class="ii-display" lang="en">{t('works.title')}</h1>
		<!-- the lead is translated, so it takes the class of whichever script it
		     is set in: gothic metrics for Japanese, Ango's for English -->
		<p
			class="lead"
			class:ii-jp={data.lang === 'ja'}
			class:ii-body={data.lang !== 'ja'}
			lang={data.lang}
		>
			{t('works.lead')}
		</p>

		<ul class="grid">
			{#each items as w, i}
				<li>
					<div class="frame"><img src={w.image} alt={w.text} loading="lazy" /></div>
					<div class="caption">
						<span class="ii-label index" lang="en">{String(i + 1).padStart(2, '0')}</span>
						<!-- credit names are Japanese source data in both languages -->
						<span class="ii-jp" lang="ja">{w.text}</span>
					</div>
				</li>
			{/each}
		</ul>
	</main>

	<Foot />
</div>

<style>
	h1 {
		/* the About frame's 167 -> 216 is top to top, so the gap is what is left
		   under a 28px line at 1.2 */
		margin-bottom: 15.4px;
	}
	.lead {
		max-width: 348px;
	}

	.grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 44px;
		margin-top: 56px;
	}
	.frame {
		aspect-ratio: 4 / 5;
		overflow: hidden;
		background: #eef2f3;
	}
	.frame img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.caption {
		display: flex;
		align-items: baseline;
		gap: 10px;
		margin-top: 12px;
	}
	.index {
		flex: none;
	}

	@media screen and (min-width: 720px) {
		h1 {
			margin-bottom: 24px;
		}
		.lead {
			max-width: 46ch;
		}
		.grid {
			grid-template-columns: repeat(3, 1fr);
			gap: 64px 3vw;
			margin-top: 96px;
		}
	}
</style>
