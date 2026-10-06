<script>
	// Shop index in the "II" direction: the inner-page shell (pale surface,
	// symbol/wordmark chrome, signature foot) with the catalogue as a plain
	// grid of plates. Presentation only — the load contract, the cart and the
	// legal link are untouched.
	import Photo from '$lib/ii/Photo.svelte';
	import Chrome from '$lib/ii/Chrome.svelte';
	import Foot from '$lib/ii/Foot.svelte';
	import CartDrawer from '$lib/shop/CartDrawer.svelte';
	import CartButton from '$lib/shop/CartButton.svelte';
	import { yen } from '$lib/shop/money.js';
	import { page } from '$app/stores';
	import { translator, localizePath, splitLang } from '$lib/i18n.js';
	export let data;

	const SITE = 'https://sui-sari.hi-843.workers.dev';

	$: t = translator(data.lang);
	$: path = (p) => localizePath(p, data.lang);
	$: jaPath = splitLang($page.url.pathname).path;
	$: enPath = localizePath(jaPath, 'en');
</script>

<svelte:head>
	<title>{t('shop.title')} — {t('common.siteName')}</title>
	<link rel="alternate" hreflang="ja" href="{SITE}{jaPath}" />
	<link rel="alternate" hreflang="en" href="{SITE}{enPath}" />
</svelte:head>

<CartButton />
<CartDrawer settings={data.settings} />

<div class="ii-page">
	<div class="ii-surface">
		<Photo sp={{ w: 2.2723, x: 0, y: 0 }} pc={{ w: 1.5, x: 0, y: 0 }} />
	</div>
	<Chrome variant="inner" tone="ink" />

	<main class="ii-main shop">
		<!-- English-only heading -->
		<h1 class="ii-display" lang="en">{t('shop.title')}</h1>

		<div class="grid">
			{#each data.products as p (p.id)}
				<a class="card" href={path(`/shop/${p.slug}`)}>
					<div class="thumb" class:soldout={p.stock === 0}>
						{#if p.image}<img src={p.image} alt={p.name} />{/if}
						{#if p.stock === 0}<span class="so ii-label" lang="en">{t('common.soldOut')}</span>{/if}
					</div>
					<!-- product copy comes from the database in Japanese only -->
					<span class="name ii-jp" lang="ja">{p.name}</span>
					{#if p.spec}<span class="spec ii-label" lang="ja">{p.spec}</span>{/if}
					<span class="price ii-body">{yen(p.price)}</span>
				</a>
			{/each}
		</div>

		{#if data.products.length === 0}
			<p class="empty ii-body ii-mute" lang={data.lang}>{t('shop.empty')}</p>
		{/if}

		<a class="legal-link ii-label" href={path('/shop/legal')} lang={data.lang}>{t('shop.legal')}</a>
	</main>

	<!-- the legal link is already in this page's flow, as Foot expects -->
	<Foot legal={false} />
</div>

<style>
	h1 {
		margin-bottom: 44px;
	}

	.grid {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 52px 0;
	}
	/* .ii a is (0,1,1); this class carries the Svelte hash, so it wins */
	.card {
		display: flex;
		flex-direction: column;
	}

	.thumb {
		position: relative;
		aspect-ratio: 4 / 5;
		overflow: hidden;
		margin-bottom: 14px;
		background: rgba(83, 103, 116, 0.06);
	}
	.thumb img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	/* the plate steps back so the notice can be read straight off it */
	.thumb.soldout img {
		opacity: 0.38;
		filter: grayscale(1);
	}
	.so {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--ii-ink);
	}

	.name {
		display: block;
	}
	.spec {
		display: block;
		margin-top: 5px;
	}
	.price {
		display: block;
		margin-top: 9px;
	}

	.empty {
		margin-top: 4px;
	}
	.legal-link {
		display: inline-block;
		margin-top: 84px;
	}

	@media screen and (min-width: 720px) {
		h1 {
			margin-bottom: 72px;
		}
		.grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 76px 4.4vw;
		}
		.legal-link {
			margin-top: 120px;
		}
	}
	/* three across only once a card would otherwise be wider than its plate */
	@media screen and (min-width: 1180px) {
		.grid {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
	}
</style>
