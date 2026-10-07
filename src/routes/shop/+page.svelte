<script>
	// Fragrance — the catalogue, on the pale "breath" surface so ink type still
	// reads over it. Each plate carries its own control: sold out, or add to
	// bag, in the same place either way.
	import Surface from '$lib/ii/Surface.svelte';
	import { BREATH } from '$lib/ii/surface.js';
	import Band from '$lib/ii/Band.svelte';
	import { chromeOverBand } from '$lib/ii/band.js';
	import Chrome from '$lib/ii/Chrome.svelte';
	import Foot from '$lib/ii/Foot.svelte';
	import CartDrawer from '$lib/shop/CartDrawer.svelte';
	import { yen } from '$lib/shop/money.js';
	import { page } from '$app/stores';
	import {translator} from '$lib/i18n.js';
	import { onMount } from 'svelte';
	export let data;

	const SITE = 'https://sui-sari.hi-843.workers.dev';

	$: t = translator(data.lang);

	// Built from the catalogue itself, so the aside appears the moment the back
	// office starts filling the field in and stays away while it is empty.
	$: categories = [...new Set(data.products.map((p) => p.category).filter(Boolean))].map(
		(name) => ({ name, n: data.products.filter((p) => p.category === name).length })
	);
	let active = null;
	$: shown = active ? data.products.filter((p) => p.category === active) : data.products;

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
	<title>{t('shop.title')} — {t('common.siteName')}</title>
	<link rel="canonical" href="{SITE}/shop" />
</svelte:head>

<CartDrawer settings={data.settings} />

<div class="ii-page shop-page">
	<Surface study={BREATH} opacity={0.5} />

	<!-- the water across the top half, with the title set over it in white -->
	<Band>
		<!-- English-only heading -->
		<h1 class="ii-display" lang="en">{t('shop.title')}</h1>
	</Band>

	<Chrome tone={overBand ? 'over' : 'ink'} />

	<main class="ii-main shop" class:has-side={categories.length}>
		<!-- The aside is only the categories now that the title has moved onto the
		     band, so it stays away entirely while the field is empty rather than
		     holding a column open for nothing. -->
		{#if categories.length}
			<aside class="side">
				<nav class="cats">
					<button class="cat ii-body" class:on={active === null} on:click={() => (active = null)} lang="en">
						All<span class="n ii-label">{data.products.length}</span>
					</button>
					{#each categories as c (c.name)}
						<button
							class="cat ii-body"
							class:on={active === c.name}
							on:click={() => (active = c.name)}
							lang="ja">{c.name}<span class="n ii-label">{c.n}</span></button
						>
					{/each}
				</nav>
			</aside>
		{/if}

		<ul class="grid">
			{#each shown as p (p.id)}
				<li class="card">
					<a class="plate" href={`/shop/${p.slug}`}>
						<div class="thumb">
							{#if p.image}<img src={p.image} alt={p.name} />{/if}
							<!-- on the plate itself, so the photograph is never dimmed -->
							{#if p.stock === 0}
								<span class="sold ii-label" lang="en">{t('common.soldOut')}</span>
							{/if}
						</div>
						<!-- product copy comes from the database in Japanese only.
						     The spec line is always rendered, empty or not: without it a
						     card with no volume sits shorter than its neighbours. -->
						<span class="name ii-jp" lang="ja">{p.name}</span>
						<span class="spec ii-label" lang="ja">{p.spec || ''}</span>
						<span class="price ii-body">{yen(p.price)}</span>
					</a>
				</li>
			{/each}
		</ul>

		{#if data.products.length === 0}
			<p class="empty ii-body ii-mute" lang={data.lang}>{t('shop.empty')}</p>
		{/if}

		<a class="legal-link ii-label" href={'/shop/legal'} lang={data.lang}>{t('shop.legal')}</a>
	</main>

	<!-- the legal link is already in this page's flow, as Foot expects -->
	<Foot legal={false} />
</div>

<style>
	/* the band is positioned against the page, so the page has to be the
	   containing block */
	.shop-page {
		position: relative;
	}
	/* the catalogue starts below the band rather than under ii.css's own top
	   padding — the title lives on the band now */
	.shop-page .ii-main {
		padding-top: 50vh;
	}

	h1 {
		margin-bottom: 44px;
	}
	.cats {
		display: flex;
		flex-wrap: wrap;
		gap: 10px 18px;
		margin: -24px 0 40px;
	}
	.cat {
		cursor: pointer;
		opacity: 0.55;
		transition: opacity 0.5s ease;
	}
	.cat.on,
	.cat:hover {
		opacity: 1;
	}
	.n {
		margin-left: 6px;
		vertical-align: super;
	}

	/* On a phone the catalogue alternates: one plate across the full width of
	   the screen, then a pair, then one, then a pair. Three items make a cycle,
	   so the first of every three takes both columns. The grid runs edge to
	   edge; the captions keep an inset from their own plate. */
	.grid {
		display: grid;
		align-items: start;
		/* the gap the title's own margin used to give, now that it has gone up
		   onto the band and the grid meets the water directly */
		margin-top: 44px;
		width: 100vw;
		margin-left: calc(-1 * var(--ii-gutter));
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 52px 8px;
		/* the page's own text margin, so a caption under a plate that reaches
		   the edge of the screen still lines up with everything else */
		--plate-pad: var(--ii-gutter);
	}
	.card:nth-child(3n + 1) {
		grid-column: 1 / -1;
	}
	.card {
		display: flex;
		flex-direction: column;
	}
	/* .ii a is (0,1,1); this class carries the Svelte hash, so it wins */
	.plate {
		display: flex;
		flex-direction: column;
	}

	.thumb {
		position: relative;
		aspect-ratio: 4 / 5;
		overflow: hidden;
		margin-bottom: 14px;
		background: rgba(57, 71, 80, 0.06);
	}
	.thumb img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	/* a small white chip on the photograph, 20px in from its corner. The
	   photograph itself is left alone — a sold-out scent is still the picture
	   someone came to look at. */
	.sold {
		position: absolute;
		top: 20px;
		left: 20px;
		background: #fff;
		color: var(--ii-ink);
		padding: 5px 9px;
		letter-spacing: 0.14em;
	}

	.name {
		display: block;
	}
	/* The image is flush to the edge of its plate; the words are not. The inset
	   was declared as --plate-pad from the start but never applied, which is why
	   every caption in the left column sat against the edge of the screen.
	   .spec is here empty or not, so a card without a volume keeps the same
	   height as one with it and the rows stay level. */
	.name,
	.spec,
	.price {
		display: block;
		margin-top: 5px;
		min-height: 1.4em;
		padding-inline: var(--plate-pad);
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
		/* the catalogue sits in the right of the screen, under the title on the
		   band — which keeps the page's own left gutter */
		.shop-page .ii-main {
			padding-left: 35vw;
		}
		h1 {
			margin-bottom: 72px;
		}
		/* the catalogue moves right of the category column, which stays with the
		   reader as the grid scrolls past. Only while there is one: without it
		   the grid would sit in a 170px track. */
		.shop.has-side {
			display: grid;
			grid-template-columns: 170px minmax(0, 1fr);
			gap: 0 5vw;
			align-items: start;
		}
		.side {
			position: sticky;
			top: 22vh;
		}
		h1 {
			margin-bottom: 36px;
		}
		.cats {
			flex-direction: column;
			gap: 10px;
			margin: 0;
		}
		/* second track only while there is a first one */
		.has-side .empty,
		.has-side .legal-link {
			grid-column: 2;
		}

		/* three even columns, narrower now that the aside takes its share */
		.grid {
			width: auto;
			margin-top: 72px;
			margin-left: 0;
			grid-template-columns: repeat(3, minmax(0, 1fr));
			gap: 84px 3vw;
			--plate-pad: 0px;
		}
		.card:nth-child(3n + 1) {
			grid-column: auto;
			--plate-pad: 0px;
		}
		.legal-link {
			margin-top: 120px;
		}
	}
</style>
