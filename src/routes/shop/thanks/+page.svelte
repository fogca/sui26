<script>
	// Order confirmation. Three states arrive from the load function: the order
	// itself, a payment Stripe has confirmed but the webhook has not yet
	// written, and nothing found. All three are the page after a purchase, so
	// the page stays quiet — one display line, then only what the reader has to
	// keep.
	import Photo from '$lib/ii/Photo.svelte';
	import Chrome from '$lib/ii/Chrome.svelte';
	import Foot from '$lib/ii/Foot.svelte';
	import { yen } from '$lib/shop/money.js';
	import { page } from '$app/stores';
	import { translator, localizePath, splitLang } from '$lib/i18n.js';
	export let data;

	const SITE = 'https://sui-sari.hi-843.workers.dev';

	$: t = translator(data.lang);
	$: en = data.lang === 'en';
	$: path = (q) => localizePath(q, data.lang);
	$: jaPath = splitLang($page.url.pathname).path;
	$: enPath = localizePath(jaPath, 'en');
</script>

<svelte:head>
	<title>{t('thanks.title')} — {t('common.siteName')}</title>
	<link rel="alternate" hreflang="ja" href="{SITE}{jaPath}" />
	<link rel="alternate" hreflang="en" href="{SITE}{enPath}" />
</svelte:head>

<div class="ii-page">
	<div class="ii-surface">
		<Photo sp={{ w: 2.2723, x: 0, y: 0 }} pc={{ w: 1.5, x: 0, y: 0 }} />
	</div>
	<Chrome variant="inner" tone="ink" />

	<main class="ii-main">
		<div class="col" lang={data.lang}>
			{#if data.order}
				<h1 class="ii-display">{t('thanks.title')}</h1>

				<p class="no">
					<span class="ii-label">{t('thanks.orderNo')}</span>
					<strong class="ii-lead num">{data.order.order_no}</strong>
				</p>

				<ul class="items">
					{#each data.order.items as i}
						<!-- product names are stored in Japanese -->
						<li><span class="ii-jp" lang="ja">{i.name} × {i.qty}</span></li>
					{/each}
				</ul>

				<p class="ii-body total">{t('thanks.totalWithTax', { amount: yen(data.order.total) })}</p>

				<p class="note" class:ii-body={en} class:ii-jp={!en}>
					{t('thanks.mailTo', { email: data.order.email })}<br />
					{t('thanks.trackingNote')}
				</p>
			{:else if data.pending}
				<h1 class="ii-display">{t('thanks.paidTitle')}</h1>
				<p class="note lone" class:ii-body={en} class:ii-jp={!en}>{t('thanks.paidNote')}</p>
			{:else}
				<h1 class="ii-display">{t('thanks.notFoundTitle')}</h1>
				<p class="note lone" class:ii-body={en} class:ii-jp={!en}>{t('thanks.notFoundNote')}</p>
			{/if}

			<a class="ii-body back" href={path('/shop')}>{t('shop.backToShop')}</a>
		</div>
	</main>

	<Foot />
</div>

<style>
	.col {
		max-width: 348px;
	}

	/* the order number is the one thing worth carrying away, so it is given a
	   line of its own under its label rather than set in bold mid-sentence */
	.no {
		margin-top: 48px;
	}
	.no .ii-label {
		display: block;
	}
	.num {
		display: block;
		margin-top: 10px;
		font-weight: var(--ii-light);
	}

	.items {
		margin-top: 40px;
		border-top: 1px solid var(--ii-rule);
	}
	.items li {
		padding: 14px 0;
		border-bottom: 1px solid var(--ii-rule-soft);
	}

	.total {
		margin-top: 28px;
	}
	.note {
		margin-top: 40px;
		line-height: 1.8;
		color: var(--ii-mute);
	}
	.note.lone {
		margin-top: 32px;
	}

	.back {
		display: inline-block;
		margin-top: 80px;
		color: var(--ii-mute);
	}

	@media screen and (min-width: 720px) {
		.col {
			/* the longest Japanese title runs 600px at the desktop display size;
			   a title this quiet should not break across two lines */
			max-width: 640px;
		}
		.no {
			margin-top: 64px;
		}
		.items {
			margin-top: 56px;
		}
		.items li {
			padding: 16px 0;
		}
		.total {
			margin-top: 32px;
		}
		.note {
			max-width: 46ch;
			margin-top: 48px;
		}
		.back {
			margin-top: 120px;
		}
	}
</style>
