<script>
	// Works — the collaboration index, in the "II" direction.
	//
	// The grid is the one the Top frame states for its project band: a 4:5
	// plate, then a caption row of a muted index and the credit in Japanese.
	// Here it runs the full deduped list on the About frame's pale surface,
	// which is the direction's inner-page ground.
	import { page } from '$app/stores';
	import Band from '$lib/ii/Band.svelte';
	import WorksStrip from '$lib/ii/WorksStrip.svelte';
	import { chromeOverBand } from '$lib/ii/band.js';
	import Chrome from '$lib/ii/Chrome.svelte';
	import Foot from '$lib/ii/Foot.svelte';
	import { onMount } from 'svelte';
	import { works } from '$lib/works.js';
	import {translator} from '$lib/i18n.js';

	export let data;

	const SITE = 'https://sui-sari.hi-843.workers.dev';

	// same source list as the home intro loop, deduped by credit name for a
	// clean static index (home shows every image incl. repeats; here each
	// collaborator appears once)
	const seen = new Set();
	const items = works.filter((w) => (seen.has(w.text) ? false : seen.add(w.text)));

	$: t = translator(data.lang);

	// White over the band, ink once the chrome has left it — a fixed white
	// header would otherwise disappear into the pale page below.
	let overBand = true;

	onMount(() => {
		const sync = () => (overBand = chromeOverBand());
		sync();
		window.addEventListener('scroll', sync, { passive: true });
		window.addEventListener('resize', sync);
		return () => {
			window.removeEventListener('scroll', sync);
			window.removeEventListener('resize', sync);
		};
	});
</script>

<svelte:head>
	<title>{t('works.title')} — {t('common.siteName')}</title>
	<link rel="canonical" href="{SITE}{$page.url.pathname}" />
</svelte:head>

<div class="ii-page works">
	<!-- the water across the top half, with the title set over it in white -->
	<Band>
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
	</Band>

	<Chrome tone={overBand ? 'over' : 'ink'} />

	<main class="ii-main">
		<!-- the work itself, as one strip moving sideways under a fixed window -->
		<WorksStrip {items} />
	</main>

	<Foot />
</div>

<style>
	/* the band is positioned against the page, so the page has to be the
	   containing block */
	.works {
		position: relative;
		/* a flat ground under the band — the drifting pale field is gone from
		   this page, so the only moving surface is the water across the top */
		--ii-bg: #f6f6f6;
	}
	/* the grid starts below the band rather than under ii.css's own top padding */
	.works .ii-main {
		padding-top: 50vh;
	}

	h1 {
		/* the About frame's 167 -> 216 is top to top, so the gap is what is left
		   under a 28px line at 1.2 */
		margin-bottom: 15.4px;
	}
	.lead {
		max-width: 348px;
	}


	@media screen and (min-width: 720px) {
		h1 {
			margin-bottom: 24px;
		}
		.lead {
			max-width: 46ch;
		}
	}
</style>
