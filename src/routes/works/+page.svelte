<script>
	// Works — the collaboration index, in the "II" direction.
	//
	// The page is flat: a title, a line, and the work itself as one strip
	// travelling sideways under a fixed window. No surface and no band — the
	// pictures are the only colour on it.
	import { page } from '$app/stores';
	import WorksStrip from '$lib/ii/WorksStrip.svelte';
	import Chrome from '$lib/ii/Chrome.svelte';
	import Foot from '$lib/ii/Foot.svelte';
	import { works } from '$lib/works.js';
	import { translator } from '$lib/i18n.js';

	export let data;

	const SITE = 'https://sui-sari.hi-843.workers.dev';

	// same source list as the home intro loop, deduped by credit name for a
	// clean static index (home shows every image incl. repeats; here each
	// collaborator appears once)
	const seen = new Set();
	const items = works.filter((w) => (seen.has(w.text) ? false : seen.add(w.text)));

	$: t = translator(data.lang);
</script>

<svelte:head>
	<title>{t('works.title')} — {t('common.siteName')}</title>
	<link rel="canonical" href="{SITE}{$page.url.pathname}" />
</svelte:head>

<div class="ii-page works">
	<Chrome tone="ink" />

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

		<!-- the work itself, as one strip moving sideways under a fixed window -->
		<WorksStrip {items} />
	</main>

	<Foot />
</div>

<style>
	.works {
		position: relative;
		--ii-bg: #f6f6f6;
	}

	h1 {
		/* the About frame's 167 -> 216 is top to top, so the gap is what is left
		   under a 28px line at 1.2 */
		margin-bottom: 15.4px;
	}
	.lead {
		max-width: 348px;
		/* the strip hangs off the line, so the gap belongs to the line */
		margin-bottom: 56px;
	}


	@media screen and (min-width: 720px) {
		h1 {
			margin-bottom: 24px;
		}
		.lead {
			max-width: 46ch;
			margin-bottom: 88px;
		}
	}
</style>
