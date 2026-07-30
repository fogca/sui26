<script>
	import Header from '../../../components/Header.svelte';
	import CartDrawer from '$lib/shop/CartDrawer.svelte';
	import CartButton from '$lib/shop/CartButton.svelte';
	import { addToCart } from '$lib/shop/cart.js';
	import { yen } from '$lib/shop/money.js';
	export let data;

	$: p = data.product;
	let qty = 1;
	let mainIndex = 0;
	$: maxQty = Math.min(9, p.stock);
</script>

<svelte:head>
	<title>{p.name} — SUI scent studio</title>
</svelte:head>

<Header />
<CartButton />
<CartDrawer settings={data.settings} />

<section class="product">
	<div class="cols">
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
			<h1 class="serif">{p.name}</h1>
			{#if p.spec}<p class="spec">{p.spec}</p>{/if}
			<p class="price">{yen(p.price)} <span class="tax">税込</span></p>

			<p class="desc">{p.description}</p>

			{#if p.stock > 0}
				<div class="buy-row">
					<select bind:value={qty} aria-label="数量">
						{#each Array.from({ length: maxQty }, (_, i) => i + 1) as n}
							<option value={n}>{n}</option>
						{/each}
					</select>
					<button class="add" on:click={() => addToCart(p.id, qty)}>カートに入れる</button>
				</div>
				{#if p.stock <= 5}
					<p class="low-stock">残り{p.stock}点</p>
				{/if}
			{:else}
				<p class="soldout">SOLD OUT</p>
			{/if}

			<div class="notes">
				<p>送料 {yen(data.settings.shipping_fee)} / {yen(data.settings.free_over)}以上で送料無料</p>
				<p>カード・Apple Pay・コンビニ払い・PayPay がご利用いただけます</p>
			</div>

			<a class="back" href="/shop">← Shop</a>
		</div>
	</div>
</section>

<style>
	.product {
		min-height: 100vh;
		min-height: 100dvh;
		padding-top: 16vh;
		padding-bottom: 12rem;
	}
	.cols {
		display: flex;
		flex-direction: column;
		gap: 3.2rem;
	}
	.gallery .main {
		width: 100%;
		aspect-ratio: 4 / 5;
		object-fit: cover;
	}
	.thumbs {
		display: flex;
		gap: 0.8rem;
		margin-top: 0.8rem;
	}
	.thumbs button {
		width: 6.4rem;
		aspect-ratio: 1;
		overflow: hidden;
		opacity: 0.5;
		transition: opacity 0.3s;
		cursor: pointer;
		padding: 0;
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

	.info h1 {
		font-size: 2rem;
		line-height: 1.4;
		letter-spacing: 0.05em;
	}
	.spec {
		font-size: 1.1rem;
		color: var(--subColor);
		margin-top: 0.4rem;
	}
	.price {
		font-size: 1.5rem;
		margin-top: 1.6rem;
	}
	.tax {
		font-size: 1rem;
		color: var(--subColor);
	}
	.desc {
		margin-top: 2.4rem;
		white-space: pre-line;
		max-width: 40rem;
	}
	.buy-row {
		display: flex;
		gap: 1.2rem;
		margin-top: 3.2rem;
		align-items: stretch;
	}
	select {
		border: 1px solid #ddd;
		padding: 0 1.2rem;
		font-size: 1.2rem;
		background: transparent;
		border-radius: 2px;
	}
	.add {
		flex: 1;
		max-width: 28rem;
		background: var(--blackColor);
		color: #fff;
		padding: 1.2rem 2rem;
		font-size: 1.25rem;
		letter-spacing: 0.05em;
		cursor: pointer;
		border-radius: 2px;
	}
	.low-stock {
		margin-top: 1rem;
		font-size: 1.05rem;
		color: #9a6b2f;
	}
	.soldout {
		margin-top: 3.2rem;
		font-size: 1.3rem;
		letter-spacing: 0.2em;
		color: var(--subColor);
	}
	.notes {
		margin-top: 2.8rem;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}
	.notes p {
		font-size: 1rem;
		color: var(--subColor);
	}
	.back {
		display: inline-block;
		margin-top: 4rem;
		font-size: 1.1rem;
		color: var(--subColor);
	}

	@media screen and (min-width: 720px) {
		.product {
			padding-top: 22vh;
		}
		.cols {
			flex-direction: row;
			gap: 6rem;
			margin-left: 30%;
			padding-right: var(--pcPadding);
		}
		.gallery {
			flex: 0 0 44%;
		}
		.info {
			flex: 1;
			padding-top: 2rem;
		}
	}
	@media screen and (max-width: 719px) {
		.cols {
			padding-left: 0;
		}
	}
</style>
