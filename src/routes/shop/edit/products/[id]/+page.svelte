<script>
	import EditorHead from '$lib/log/EditorHead.svelte';
	import ProductForm from '$lib/shop/ProductForm.svelte';
	import { enhance } from '$app/forms';
	export let data;
	export let form;
</script>

<EditorHead />
<svelte:head><title>{data.product.name} — 商品編集</title></svelte:head>

<section class="wrap">
	<div class="head">
		<h1 class="serif">商品を編集</h1>
		<a class="view" href="/shop/{data.product.slug}" target="_blank">商品ページを見る ↗</a>
	</div>

	<ProductForm product={data.product} {form} />

	<form
		method="POST"
		action="?/delete"
		use:enhance={({ cancel }) => {
			if (!confirm('この商品を削除しますか？')) cancel();
		}}
		class="danger-zone">
		<button type="submit">商品を削除</button>
	</form>
</section>

<style>
	.wrap {
		max-width: 56rem;
		margin: 0 auto;
		padding: calc(8vh + env(safe-area-inset-top)) var(--padding) 8rem;
	}
	.head {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		margin-bottom: 2.8rem;
	}
	h1 {
		font-size: 1.8rem;
		letter-spacing: 0.05em;
	}
	.view {
		font-size: 1.05rem;
		color: var(--subColor);
	}
	.danger-zone {
		margin-top: 4rem;
		border-top: 1px solid #eee;
		padding-top: 2rem;
	}
	.danger-zone button {
		color: #c0392b;
		font-size: 1.05rem;
		cursor: pointer;
	}
</style>
