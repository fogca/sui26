<script>
	import AdminShell from '$lib/admin/AdminShell.svelte';
	import ConfirmButton from '$lib/admin/ConfirmButton.svelte';
	import ProductForm from '$lib/shop/ProductForm.svelte';
	import { yen } from '$lib/shop/money.js';
	import { NOUN, itemStatusLabel } from '$lib/shop/vocab.js';

	export let data;
	export let form;

	const stamp = new Intl.DateTimeFormat('sv-SE', {
		timeZone: 'Asia/Tokyo',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit'
	});

	$: product = data.product;

	// "?created=1" only announces the arrival, so it is read once and retired as
	// soon as the owner saves — two success notices at a time would be noise.
	let created = data.created;
	$: updated = product.updated_at ? stamp.format(new Date(product.updated_at)) : '';
	$: subtitle = [
		itemStatusLabel(product.status),
		`/shop/${product.slug}`,
		yen(product.price),
		updated ? `最終更新 ${updated}` : ''
	]
		.filter(Boolean)
		.join(' · ');
</script>

<AdminShell title={product.name} section="products" {subtitle}>
	<span class="hd-actions" slot="actions">
		{#if product.status === 'published'}
			<a class="a-btn" href="/shop/{product.slug}" target="_blank" rel="noopener">公開ページを見る ↗</a>
		{/if}
		<a class="a-btn" href="/shop/edit/products">← 一覧へ</a>
	</span>

	{#if created}
		<p class="created" role="status">{NOUN.item}を作成しました。続けて内容を編集できます。</p>
	{/if}

	<ProductForm
		{product}
		{form}
		action="?/save"
		categories={data.categories}
		onSaved={() => (created = false)}
	/>

	<div class="danger">
		<h2 class="serif">危険な操作</h2>
		<p class="desc">
			この{NOUN.item}を完全に削除します。取り消せません。オーダー履歴に残った{NOUN.item}名や金額はそのままですが、公開ページは
			404 になります。アップロード済みの画像はストレージに残ります。
		</p>
		<form method="POST" action="?/delete">
			<ConfirmButton
				tone="danger"
				label="この{NOUN.item}を削除"
				message={`「${product.name}」を削除します。この操作は取り消せません。よろしいですか？`}
			/>
		</form>
	</div>
</AdminShell>

<style>
	/* keep both buttons as flex items of the shell's own .actions row */
	.hd-actions {
		display: contents;
	}
	.created {
		margin-bottom: 2.4rem;
		padding: 1rem 1.4rem;
		border: 1px solid #d5e0d7;
		border-radius: 3px;
		background-color: #f7faf7;
		font-size: 1.1rem;
		line-height: 1.6;
		text-align: left;
		color: #4d6b57;
	}
	.danger {
		margin-top: 5.6rem;
		padding-top: 2.8rem;
		border-top: 1px solid #eee;
	}
	h2 {
		font-size: 1.4rem;
		line-height: 1.4;
		color: var(--blackColor);
	}
	.desc {
		margin: 0.8rem 0 1.8rem;
		max-width: 56rem;
		font-size: 1.05rem;
		line-height: 1.8;
		text-align: left;
		color: var(--subColor);
	}
</style>
