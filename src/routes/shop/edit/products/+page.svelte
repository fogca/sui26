<script>
	import EditorHead from '$lib/log/EditorHead.svelte';
	import { yen } from '$lib/shop/money.js';
	export let data;
</script>

<EditorHead />
<svelte:head><title>商品管理 — Shop</title></svelte:head>

<section class="products">
	<div class="head">
		<h1 class="serif">商品</h1>
		<div class="acts">
			<a class="new" href="/shop/edit/products/new">＋ 新規商品</a>
			<a class="dim" href="/shop/edit">← Dashboard</a>
		</div>
	</div>

	<ul class="list">
		{#each data.products as p (p.id)}
			<li>
				<a href="/shop/edit/products/{p.id}">
					<div class="thumb">
						{#if p.images[0]}<img src={p.images[0]} alt="" />{/if}
					</div>
					<div class="meta">
						<span class="name">{p.name}</span>
						<span class="sub">{p.spec}</span>
					</div>
					<span class="price">{yen(p.price)}</span>
					<span class="stock" class:zero={p.stock === 0}>{p.stock === 0 ? '売り切れ' : `在庫${p.stock}`}</span>
					<span class="badge {p.status}">{p.status === 'published' ? '公開' : '下書き'}</span>
				</a>
			</li>
		{/each}
		{#if data.products.length === 0}
			<li class="empty">商品がまだありません。</li>
		{/if}
	</ul>
</section>

<style>
	.products {
		max-width: 64rem;
		margin: 0 auto;
		padding: calc(8vh + env(safe-area-inset-top)) var(--padding) 8rem;
	}
	.head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 1.2rem;
		margin-bottom: 2.8rem;
	}
	h1 {
		font-size: 2rem;
		letter-spacing: 0.05em;
	}
	.acts {
		display: flex;
		gap: 1.6rem;
		align-items: baseline;
	}
	.new {
		font-size: 1.2rem;
		color: var(--blackColor);
	}
	.dim {
		font-size: 1.05rem;
		color: var(--subColor);
	}
	.list li a {
		display: flex;
		align-items: center;
		gap: 1.4rem;
		padding: 1.1rem 0;
		border-bottom: 1px solid #f0eeec;
		width: 100%;
	}
	.thumb {
		width: 5.2rem;
		height: 6.4rem;
		background: #f1efec;
		flex: 0 0 auto;
	}
	.thumb img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.meta {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		min-width: 0;
	}
	.name {
		font-size: 1.25rem;
	}
	.sub {
		font-size: 1rem;
		color: var(--subColor);
	}
	.price {
		margin-left: auto;
		font-size: 1.15rem;
		flex: 0 0 auto;
	}
	.stock {
		font-size: 1rem;
		color: var(--subColor);
		flex: 0 0 auto;
	}
	.stock.zero {
		color: #c0392b;
	}
	.badge {
		font-size: 0.9rem;
		padding: 0.2rem 0.6rem;
		border-radius: 2px;
		flex: 0 0 auto;
	}
	.badge.published {
		background: #edf2ee;
		color: #4a6b52;
	}
	.badge.draft {
		background: #f2efe9;
		color: #8a7a5a;
	}
	.empty {
		color: var(--subColor);
		padding: 1.4rem 0;
	}
</style>
