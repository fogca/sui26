<script>
	// Works — the collaboration index, in the "II" direction.
	//
	// One screen, and it does not scroll: the strip fills it and the pictures
	// sit on its centre line. The title is in the bottom corner, and the line
	// under it starts as the studio's own and gives way to the name of whatever
	// is centred the moment the strip is moved — one line, not two. No surface,
	// no band and no foot: the pictures are the only colour on the page, and
	// because there is nothing to scroll to, a plain wheel drives the strip.
	import { page } from '$app/stores';
	import WorksStrip from '$lib/ii/WorksStrip.svelte';
	import Chrome from '$lib/ii/Chrome.svelte';
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

	/** The strip fills these in: the name on the centre line, and whether it
	 *  has been moved at all yet. */
	let centred = '';
	let moved = false;

	// credits are Japanese source data in either language; the studio's own
	// line is in whichever the page is set in
	$: line = moved ? centred : t('works.lead');
	$: lineLang = moved ? 'ja' : data.lang;
</script>

<svelte:head>
	<title>{t('works.title')} — {t('common.siteName')}</title>
	<link rel="canonical" href="{SITE}{$page.url.pathname}" />
</svelte:head>

<div class="ii-page works">
	<Chrome tone="ink" />

	<!-- the work itself, filling the screen, on its centre line -->
	<WorksStrip {items} takeVertical bind:name={centred} bind:moved />

	<div class="plate">
		<!-- English-only heading -->
		<h1 class="ii-display" lang="en">{t('works.title')}</h1>
		<!-- the lead is translated, so it takes the class of whichever script it
		     is set in: gothic metrics for Japanese, Ango's for English -->
		<p
			class="lead"
			class:ii-jp={lineLang === 'ja'}
			class:ii-body={lineLang !== 'ja'}
			lang={lineLang}
		>
			{line}
		</p>
	</div>
</div>

<style>
	.works {
		position: relative;
		--ii-bg: #f6f6f6;
		/* one screen, and it stays one screen: the strip is the only thing that
		   moves and it moves sideways */
		height: 100vh;
		height: 100dvh;
		overflow: hidden;
	}

	/* the title in the corner, opposite the strip's own name line */
	.plate {
		position: absolute;
		left: var(--ii-gutter);
		bottom: calc(24px + env(safe-area-inset-bottom));
		z-index: 2;
		pointer-events: none;
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
		.plate {
			bottom: 40px;
		}
		h1 {
			margin-bottom: 24px;
		}
		.lead {
			max-width: 46ch;
		}
	}
</style>
