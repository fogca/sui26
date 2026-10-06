<script>
	import AdminShell from '$lib/admin/AdminShell.svelte';
	import ProductForm from '$lib/shop/ProductForm.svelte';
	import { NOUN } from '$lib/shop/vocab.js';

	export let data;
	export let form;
</script>

<AdminShell
	title="{NOUN.item}を作成"
	section="products"
	subtitle="下書きのまま保存して、あとから公開できます。"
>
	<a class="a-btn" slot="actions" href="/shop/edit/products">← 一覧へ</a>

	<ProductForm {form} categories={data.categories} />
</AdminShell>
