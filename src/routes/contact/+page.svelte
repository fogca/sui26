<script>
	// Contact — a new public page in the "II" direction, lifted from the
	// prototype at /ii/contact and made bilingual.
	//
	// The form has no backend: it composes the same mail draft the site already
	// sends people to, with the fields filled in. Wiring it to Resend is a
	// separate decision. Subject line and body labels follow the reader's
	// language; the copy itself is the studio's existing contact text in
	// i18n.js, not new writing.
	import { page } from '$app/stores';
	import Surface from '$lib/ii/Surface.svelte';
	import { BREATH } from '$lib/ii/surface.js';
	import Chrome from '$lib/ii/Chrome.svelte';
	import Foot from '$lib/ii/Foot.svelte';
	import {translator, both} from '$lib/i18n.js';

	export let data;

	const SITE = 'https://sui-sari.hi-843.workers.dev';
	const TO = 'hello@sari-scent.jp';

	// Stored as keys, not as translated labels, so the picked subject survives
	// whatever language the page is rendered in.
	const SUBJECT_KEYS = ['collab', 'product', 'press', 'other'];

	let name = '';
	let email = '';
	let subjectKey = SUBJECT_KEYS[0];
	let message = '';

	$: t = translator(data.lang);
	$: lead = both('contact.lead');
	// hreflang pair for this page, derived from the un-prefixed route

	// Japanese body copy is set in the gothic at its own measure; English takes
	// the Latin body size. Applied with class: directives rather than an
	// interpolated string so Svelte's scoped-CSS analysis can still see them.

	function send() {
		// the draft is addressed to the studio, who read Japanese, so its
		// labels and punctuation are Japanese whatever the reader was shown
		const sep = '：';
		const divider = '｜';
		const subjectLabel = both('contact.subject.' + subjectKey).ja;

		const body = [
			`${t('contact.name')}${sep}${name}`,
			`${t('contact.email')}${sep}${email}`,
			`${t('contact.subject')}${sep}${subjectLabel}`,
			'',
			message
		].join('\n');

		const href =
			`mailto:${TO}?subject=` +
			encodeURIComponent(`${t('common.siteName')}${divider}${subjectLabel}`) +
			'&body=' +
			encodeURIComponent(body);
		window.location.href = href;
	}
</script>

<svelte:head>
	<title>{t('contact.title')} — {t('common.siteName')}</title>
	<link rel="canonical" href="{SITE}{$page.url.pathname}" />
</svelte:head>

<div class="ii-page">
	<Surface study={BREATH} />
	<Chrome tone="ink" />

	<main class="ii-main">
		<!-- the title reads the same in both languages -->
		<h1 class="ii-display" lang="en">{t('contact.title')}</h1>

		<div class="ii-measure lead">
			<p class="ii-jp ja" lang="ja">{lead.ja}</p>
			<p class="ii-body en" lang="en">{lead.en}</p>
		</div>

		<form class="ii-measure form" on:submit|preventDefault={send}>
			<label class="ii-field field">
				<span class="ii-label" lang={data.lang}>{t('contact.name')}</span>
				<input type="text" bind:value={name} required autocomplete="name" />
			</label>

			<label class="ii-field field">
				<span class="ii-label" lang={data.lang}>{t('contact.email')}</span>
				<input type="email" bind:value={email} required autocomplete="email" />
			</label>

			<label class="ii-field field">
				<span class="ii-label" lang={data.lang}>{t('contact.subject')}</span>
				<select class="ii-caret" bind:value={subjectKey} lang={data.lang}>
					{#each SUBJECT_KEYS as key}
						<option value={key}>{t('contact.subject.' + key)}</option>
					{/each}
				</select>
			</label>

			<label class="ii-field field">
				<span class="ii-label" lang={data.lang}>{t('contact.message')}</span>
				<textarea rows="5" bind:value={message} required></textarea>
			</label>

			<button class="ii-btn send" type="submit" lang={data.lang}>{t('contact.send')}</button>

			<p class="ii-mute note ii-jp" lang={data.lang}>
				{t('contact.note')}
			</p>
		</form>
	</main>

	<Foot />
</div>

<style>
	h1 {
		margin-bottom: 49px;
	}
	/* the lead is authored with hard line breaks in i18n.js */
	.lead p {
		white-space: pre-line;
	}
	.lead .en {
		margin-top: 20px;
	}
	.lead {
		white-space: pre-line;
	}
	/* pinned here because `.ii [lang='ja']` also sets a leading, and load order
	   between it and this component's sheet is not something to rely on */

	/* the measure comes from .ii-measure on the element */
	.form {
		margin-top: 64px;
	}
	.field {
		margin-bottom: 32px;
	}
	/* ii.css resets `.ii select` at (0,1,1), which outranks .ii-caret (0,1,0)
	   and takes the hairline arrow with it via the `background` shorthand;
	   .ii-field select then wins the padding. This selector carries the Svelte
	   hash, so the caret the class asks for comes back. The class stays on the
	   element: when ii.css is corrected, this rule becomes a no-op. */
	.field select {
		background-image: linear-gradient(45deg, transparent 50%, var(--ii-mute) 50%),
			linear-gradient(135deg, var(--ii-mute) 50%, transparent 50%);
		background-position: right 5px top 1.05em, right 1px top 1.05em;
		background-size: 4px 4px, 4px 4px;
		background-repeat: no-repeat;
		padding-right: 16px;
	}
	.send {
		margin-top: 8px;
	}
	/* same clash: `.ii button` (0,1,1) strips .ii-btn's hairline box and resets
	   its size to inherit. Restored here rather than in the shared sheet. */
	.send.ii-btn {
		border: 1px solid var(--ii-ink);
		font-size: 11px;
		line-height: 1.8;
	}
	.note {
		margin-top: 16px;
	}

	@media screen and (min-width: 720px) {
		h1 {
			margin-bottom: 64px;
		}
		.form {
			margin-top: 96px;
		}
	}
</style>
