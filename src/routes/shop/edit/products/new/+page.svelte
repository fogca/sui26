<script>
	import EditorHead from '$lib/log/EditorHead.svelte';
	import ProductForm from '$lib/shop/ProductForm.svelte';
	export let form;
</script>

<EditorHead />
<svelte:head><title>新規商品 — Shop</title></svelte:head>

<section class="wrap">
	<h1 class="serif">新規商品</h1>
	<ProductForm {form} />
</section>

<style>
	.wrap {
		max-width: 56rem;
		margin: 0 auto;
		padding: calc(8vh + env(safe-area-inset-top)) var(--padding) 8rem;
	}
	h1 {
		font-size: 1.8rem;
		letter-spacing: 0.05em;
		margin-bottom: 2.8rem;
	}
</style>
