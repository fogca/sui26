<script>
	// Product detail in the "II" direction. Every piece of commerce behaviour is
	// the one that was here before — gallery index, quantity bound to maxQty,
	// addToCart, the low-stock and sold-out branches, the shipping and payment
	// notes. Only the presentation changed.
	import Photo from '$lib/ii/Photo.svelte';
	import Chrome from '$lib/ii/Chrome.svelte';
	import Foot from '$lib/ii/Foot.svelte';
	import CartDrawer from '$lib/shop/CartDrawer.svelte';
	import CartButton from '$lib/shop/CartButton.svelte';
	import { addToCart } from '$lib/shop/cart.js';
	import { yen } from '$lib/shop/money.js';
	import { page } from '$app/stores';
	import { translator, localizePath, splitLang } from '$lib/i18n.js';
	export let data;

	const SITE = 'https://sui-sari.hi-843.workers.dev';

	$: p = data.product;
	let qty = 1;
	let mainIndex = 0;
	$: maxQty = Math.min(9, p.stock);

	$: t = translator(data.lang);
	$: path = (q) => localizePath(q, data.lang);
	$: jaPath = splitLang($page.url.pathname).path;
	$: enPath = localizePath(jaPath, 'en');
</script>

<svelte:head>
	<title>{p.name} — {t('common.siteName')}</title>
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

	<main class="ii-main product">
		<div class="gallery">
			{#if p.images[mainIndex]}
				<img class="main" src={p.images[mainIndex]} alt={p.name} />
			{/if}
			{#if p.images.length > 1}
				<div class="thumbs">
					{#each p.images as img, i}
						<button class:active={i === mainIndex} on:click={() => (mainIndex = i)}>
							<img src={img} alt="" />
						</button>
					{/each}
				</div>
			{/if}
		</div>

		<div class="info">
			<!-- name / spec / description are Japanese-only database copy -->
			<h1 class="ii-display title" lang="ja">{p.name}</h1>
			{#if p.spec}<p class="spec ii-label" lang="ja">{p.spec}</p>{/if}
			<p class="price ii-body">
				{yen(p.price)} <span class="tax ii-label" lang={data.lang}>{t('shop.taxIncluded')}</span>
			</p>

			{#if data.lang === 'en'}
				<p class="ja-only ii-body ii-mute" lang="en">{t('common.jaOnly')}</p>
			{/if}
			<p class="desc ii-jp" lang="ja">{p.description}</p>

			{#if p.stock > 0}
				<div class="buy-row">
					<label class="ii-field qty">
						<span class="ii-label" lang={data.lang}>{t('shop.quantity')}</span>
						<select
							class="ii-caret"
							bind:value={qty}
							aria-label={t('shop.quantity')}
							lang={data.lang}
						>
							{#each Array.from({ length: maxQty }, (_, i) => i + 1) as n}
								<option value={n}>{n}</option>
							{/each}
						</select>
					</label>
					<button class="ii-btn add" lang={data.lang} on:click={() => addToCart(p.id, qty)}>
						{t('shop.addToCart')}
					</button>
				</div>
				{#if p.stock <= 5}
					<p class="low-stock ii-body" lang={data.lang}>{t('shop.remaining', { n: p.stock })}</p>
				{/if}
			{:else}
				<p class="soldout ii-label" lang="en">{t('common.soldOut')}</p>
			{/if}

			<div class="notes" lang={data.lang}>
				<p class="ii-label">
					{t('shop.shippingNote', {
						fee: yen(data.settings.shipping_fee),
						free: yen(data.settings.free_over)
					})}
				</p>
				<p class="ii-label">{t('shop.paymentMethods')}</p>
			</div>

			<a class="back ii-body" href={path('/shop')} lang="en">← {t('shop.title')}</a>
		</div>
	</main>

	<Foot />
</div>

<style>
	.gallery .main {
		width: 100%;
		aspect-ratio: 4 / 5;
		object-fit: cover;
	}
	.thumbs {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-top: 8px;
	}
	.thumbs button {
		width: 62px;
		aspect-ratio: 1;
		overflow: hidden;
		padding: 0;
		opacity: 0.4;
		cursor: pointer;
		transition: opacity 0.5s ease;
	}
	.thumbs button.active,
	.thumbs button:hover {
		opacity: 1;
	}
	.thumbs img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.info {
		margin-top: 44px;
	}
	/* the Japanese face comes in at line-height 1.8, which is leading for body
	   copy, not for a 28/44px title */
	h1.title {
		line-height: 1.3;
	}
	.spec {
		margin-top: 10px;
	}
	.price {
		margin-top: 22px;
	}
	.tax {
		margin-left: 6px;
	}
	/* note shown above Japanese-only product copy on the English pages */
	.ja-only {
		margin-top: 34px;
	}
	.desc {
		margin-top: 34px;
		white-space: pre-line;
		max-width: 348px;
	}
	.ja-only + .desc {
		margin-top: 10px;
	}

	.buy-row {
		display: flex;
		align-items: flex-end;
		gap: 20px;
		margin-top: 44px;
	}
	.qty {
		flex: 0 0 76px;
	}
	/* ii.css resets `.ii select` at (0,1,1), which outranks .ii-caret (0,1,0)
	   and takes the hairline arrow with the `background` shorthand; .ii-field
	   select then wins padding at (0,2,0). This selector carries the Svelte
	   hash, so the caret the class asks for comes back. The class stays on the
	   element: when ii.css is corrected, this rule becomes a no-op. */
	.qty select {
		background-image: linear-gradient(45deg, transparent 50%, var(--ii-mute) 50%),
			linear-gradient(135deg, var(--ii-mute) 50%, transparent 50%);
		background-position: right 5px top 1.05em, right 1px top 1.05em;
		background-size: 4px 4px, 4px 4px;
		background-repeat: no-repeat;
		padding-right: 16px;
	}
	.add {
		flex: 1;
		max-width: 260px;
	}
	/* same clash: `.ii button` (0,1,1) strips .ii-btn's border and resets its
	   size to inherit. Restored here rather than in the shared sheet. */
	.add.ii-btn {
		border: 1px solid var(--ii-ink);
		font-size: 11px;
		line-height: 1.8;
	}
	.low-stock {
		margin-top: 14px;
		color: var(--ii-alert);
	}
	.soldout {
		margin-top: 44px;
	}

	.notes {
		margin-top: 34px;
	}
	.notes p + p {
		margin-top: 6px;
	}
	.back {
		display: inline-block;
		margin-top: 56px;
		color: var(--ii-mute);
	}

	@media screen and (min-width: 720px) {
		.product {
			display: grid;
			/* the plate takes so much of the row at 1 : 1 that the copy wraps at
			   ~27 characters; 1.2 : 1 puts the information back to a measure */
			grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
			gap: 0 5vw;
			align-items: start;
		}
		.thumbs {
			gap: 10px;
			margin-top: 10px;
		}
		.thumbs button {
			width: 78px;
		}
		.info {
			margin-top: 0;
			max-width: 46ch;
		}
		.desc {
			max-width: none;
		}
		.add {
			max-width: 300px;
		}
	}
</style>
