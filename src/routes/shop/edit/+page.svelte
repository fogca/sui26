<script>
	import EditorHead from '$lib/log/EditorHead.svelte';
	import { yen } from '$lib/shop/money.js';
	export let data;
</script>

<EditorHead />
<svelte:head><title>Shop Dashboard</title></svelte:head>

<section class="dash">
	<div class="head">
		<h1 class="serif">Shop Dashboard</h1>
		<nav>
			<a href="/shop/edit/products">商品</a>
			<a href="/shop/edit/orders">受注</a>
			<a href="/shop/edit/settings">設定</a>
			<a class="dim" href="/log/edit">log</a>
			<a class="dim" href="/shop" target="_blank">店を見る ↗</a>
		</nav>
	</div>

	<div class="stats">
		<div class="stat">
			<span class="v">{yen(data.stats.monthSales)}</span>
			<span class="k">今月の売上</span>
		</div>
		<div class="stat">
			<span class="v">{data.stats.monthCount}<small>件</small></span>
			<span class="k">今月の注文</span>
		</div>
		<div class="stat" class:warn={data.stats.unshippedCount > 0}>
			<span class="v">{data.stats.unshippedCount}<small>件</small></span>
			<span class="k">未発送</span>
		</div>
		<div class="stat">
			<span class="v">{data.stats.publishedCount}<small>点</small></span>
			<span class="k">公開中の商品</span>
		</div>
	</div>

	{#if data.unshipped.length > 0}
		<h2>未発送の注文</h2>
		<ul class="list">
			{#each data.unshipped as o (o.id)}
				<li>
					<a href="/shop/edit/orders">
						<span class="mono">{o.order_no}</span>
						<span>{o.name} 様</span>
						<span>{yen(o.total)}</span>
						<span class="dim">{o.created_at?.slice(0, 10)}</span>
					</a>
				</li>
			{/each}
		</ul>
		<a class="more" href="/shop/edit/orders">受注管理へ →</a>
	{/if}

	{#if data.lowStock.length > 0}
		<h2>在庫わずか・売り切れ</h2>
		<ul class="list">
			{#each data.lowStock as p (p.id)}
				<li>
					<a href="/shop/edit/products/{p.id}">
						<span>{p.name}</span>
						<span class={p.stock === 0 ? 'zero' : 'low'}>{p.stock === 0 ? '売り切れ' : `残り${p.stock}点`}</span>
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</section>

<style>
	.dash {
		max-width: 64rem;
		margin: 0 auto;
		padding: calc(8vh + env(safe-area-inset-top)) var(--padding) 8rem;
	}
	.head {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		justify-content: space-between;
		gap: 1.2rem;
		margin-bottom: 3.2rem;
	}
	h1 {
		font-size: 2rem;
		letter-spacing: 0.05em;
	}
	nav {
		display: flex;
		gap: 1.6rem;
	}
	nav a {
		font-size: 1.15rem;
		color: var(--blackColor);
	}
	nav a.dim {
		color: var(--subColor);
	}
	.stats {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1.2rem;
		margin-bottom: 4rem;
	}
	.stat {
		border: 1px solid #eee;
		border-radius: 4px;
		padding: 1.6rem;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}
	.stat.warn {
		border-color: #e8c9a0;
		background: #fdf8f1;
	}
	.v {
		font-size: 2rem;
		color: var(--blackColor);
	}
	.v small {
		font-size: 1.1rem;
		margin-left: 0.2rem;
	}
	.k {
		font-size: 1rem;
		color: var(--subColor);
	}
	h2 {
		font-size: 1.3rem;
		margin: 3.2rem 0 1.2rem;
	}
	.list li a {
		display: flex;
		gap: 1.6rem;
		align-items: baseline;
		padding: 1rem 0;
		border-bottom: 1px solid #f0eeec;
		width: 100%;
		font-size: 1.15rem;
	}
	.mono {
		font-size: 1rem;
		color: var(--subColor);
	}
	.dim {
		color: var(--subColor);
		font-size: 1rem;
		margin-left: auto;
	}
	.low {
		color: #9a6b2f;
	}
	.zero {
		color: #c0392b;
	}
	.more {
		display: inline-block;
		margin-top: 1.2rem;
		font-size: 1.1rem;
		color: var(--blackColor);
	}

	@media screen and (min-width: 720px) {
		.stats {
			grid-template-columns: repeat(4, 1fr);
		}
	}
</style>
