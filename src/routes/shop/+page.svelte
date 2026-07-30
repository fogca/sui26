<script>
	import Header from '../../components/Header.svelte';
	import CartDrawer from '$lib/shop/CartDrawer.svelte';
	import CartButton from '$lib/shop/CartButton.svelte';
	import { yen } from '$lib/shop/money.js';
	export let data;
</script>

<svelte:head>
	<title>Shop — SUI scent studio</title>
</svelte:head>

<Header />
<CartButton />
<CartDrawer settings={data.settings} />

<section class="shop-index">
	<div class="wrapper">
		<h1 class="serif">Shop</h1>

		<div class="grid">
			{#each data.products as p (p.id)}
				<a class="card" href="/shop/{p.slug}">
					<div class="thumb" class:soldout={p.stock === 0}>
						{#if p.image}<img src={p.image} alt={p.name} />{/if}
						{#if p.stock === 0}<span class="so">SOLD OUT</span>{/if}
					</div>
					<span class="name serif">{p.name}</span>
					{#if p.spec}<span class="spec">{p.spec}</span>{/if}
					<span class="price">{yen(p.price)}</span>
				</a>
			{/each}
		</div>

		{#if data.products.length === 0}
			<p class="empty">ただいま準備中です。</p>
		{/if}

		<a class="legal-link" href="/shop/legal">特定商取引法に基づく表記</a>
	</div>
</section>

<style>
	.shop-index {
		min-height: 100vh;
		min-height: 100dvh;
		padding-top: 22vh;
		padding-bottom: 12rem;
	}
	.wrapper {
		margin-left: 30%;
	}
	h1 {
		font-size: 2rem;
		letter-spacing: 0.05em;
		margin-bottom: 4rem;
	}
	.grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 4rem 2.4rem;
		max-width: 72rem;
	}
	.card {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}
	.thumb {
		position: relative;
		aspect-ratio: 4 / 5;
		overflow: hidden;
		margin-bottom: 0.8rem;
		background: #f1efec;
	}
	.thumb img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 1.2s ease;
	}
	.card:hover .thumb img {
		transform: scale(1.03);
	}
	.thumb.soldout img {
		opacity: 0.55;
		filter: grayscale(0.4);
	}
	.so {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1rem;
		letter-spacing: 0.2em;
		color: var(--blackColor);
	}
	.name {
		font-size: 1.4rem;
		line-height: 1.5;
	}
	.spec {
		font-size: 1rem;
		color: var(--subColor);
	}
	.price {
		font-size: 1.15rem;
		margin-top: 0.2rem;
	}
	.empty {
		color: var(--subColor);
	}
	.legal-link {
		display: inline-block;
		margin-top: 6rem;
		font-size: 1rem;
		color: var(--subColor);
	}

	@media screen and (min-width: 720px) {
		.shop-index {
			padding-top: 28vh;
		}
		.wrapper {
			margin-left: 52.5%;
			padding-right: var(--pcPadding);
		}
		.grid {
			grid-template-columns: 1fr 1fr;
		}
	}
</style>
