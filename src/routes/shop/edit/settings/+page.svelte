<script>
	import EditorHead from '$lib/log/EditorHead.svelte';
	import { enhance } from '$app/forms';
	export let data;
	export let form;
</script>

<EditorHead />
<svelte:head><title>設定 — Shop</title></svelte:head>

<section class="wrap">
	<div class="head">
		<h1 class="serif">Shop 設定</h1>
		<a class="dim" href="/shop/edit">← Dashboard</a>
	</div>

	<form method="POST" use:enhance class="sform">
		<h2>送料</h2>
		<div class="row">
			<label>
				<span>送料（全国一律・円）</span>
				<input name="shipping_fee" type="number" min="0" value={data.settings.shipping_fee} />
			</label>
			<label>
				<span>送料無料ライン（円）</span>
				<input name="free_over" type="number" min="0" value={data.settings.free_over} />
			</label>
		</div>

		<h2>ご依頼主情報（B2送り状用）</h2>
		<label>
			<span>名前</span>
			<input name="sender_name" value={data.settings.sender_name} />
		</label>
		<div class="row">
			<label>
				<span>郵便番号</span>
				<input name="sender_zip" value={data.settings.sender_zip} placeholder="150-0001" />
			</label>
			<label>
				<span>電話番号</span>
				<input name="sender_tel" value={data.settings.sender_tel} placeholder="03-0000-0000" />
			</label>
		</div>
		<label>
			<span>住所</span>
			<input name="sender_addr" value={data.settings.sender_addr} placeholder="東京都渋谷区…" />
		</label>

		<h2>ヤマトB2契約情報</h2>
		<div class="row">
			<label>
				<span>ご請求先顧客コード</span>
				<input name="b2_customer_code" value={data.settings.b2_customer_code} />
			</label>
			<label>
				<span>運賃管理番号</span>
				<input name="b2_fare_no" value={data.settings.b2_fare_no} placeholder="01" />
			</label>
		</div>
		<p class="hint">B2クラウドの契約情報画面で確認できます。CSV取込で請求先を決める値なので正確に。</p>

		{#if form?.error}<p class="err">{form.error}</p>{/if}
		{#if form?.ok}<p class="ok">保存しました</p>{/if}

		<button type="submit" class="save">保存</button>
	</form>
</section>

<style>
	.wrap {
		max-width: 48rem;
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
	.dim {
		color: var(--subColor);
		font-size: 1.05rem;
	}
	.sform {
		display: flex;
		flex-direction: column;
		gap: 1.6rem;
	}
	h2 {
		font-size: 1.2rem;
		margin-top: 1.6rem;
	}
	label {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		flex: 1;
	}
	label span {
		font-size: 1rem;
		color: var(--subColor);
	}
	input {
		border: 1px solid #ddd;
		padding: 0.8rem;
		font-size: 1.2rem;
		background: #fff;
		border-radius: 2px;
	}
	.row {
		display: flex;
		gap: 1.4rem;
	}
	.hint {
		font-size: 0.95rem;
		color: var(--subColor);
	}
	.err {
		color: #c0392b;
	}
	.ok {
		color: #4a6b52;
	}
	.save {
		align-self: flex-start;
		background: var(--blackColor);
		color: #fff;
		padding: 0.9rem 2.8rem;
		font-size: 1.2rem;
		cursor: pointer;
		border-radius: 3px;
		margin-top: 1.2rem;
	}
</style>
