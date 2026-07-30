<script>
	import { enhance } from '$app/forms';
	import EditorHead from '$lib/log/EditorHead.svelte';
	export let form;
</script>

<EditorHead />
<svelte:head><title>新規ページ — log editor</title></svelte:head>

<section class="new-page">
	<form method="POST" use:enhance class="box">
		<h1 class="serif">新規ページ</h1>

		<label>
			<span>タイトル</span>
			<input name="title" value={form?.title ?? ''} placeholder="春の覚え書き" />
		</label>

		<label>
			<span>slug（URL）</span>
			<input name="slug" value={form?.slug ?? ''} placeholder="spring-note" />
			<small>公開URL: /log/&lt;slug&gt;</small>
		</label>

		{#if form?.error}<p class="err">{form.error}</p>{/if}

		<div class="actions">
			<a href="/log/edit" class="cancel">← 戻る</a>
			<button type="submit">作成して編集へ</button>
		</div>
	</form>
</section>

<style>
	.new-page {
		max-width: 40rem;
		margin: 0 auto;
		padding-top: 14vh;
	}
	.box {
		display: flex;
		flex-direction: column;
		gap: 1.8rem;
	}
	h1 {
		font-size: 1.8rem;
		letter-spacing: 0.05em;
	}
	label {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	label span {
		font-size: 1.05rem;
		color: var(--subColor);
	}
	input {
		border-bottom: 1px solid #ddd;
		padding: 0.5rem 0;
		font-size: 1.35rem;
	}
	small {
		color: var(--subColor);
		font-size: 0.95rem;
	}
	.actions {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: 1rem;
	}
	.cancel {
		color: var(--subColor);
		font-size: 1.1rem;
	}
	button {
		font-size: 1.2rem;
		color: var(--blackColor);
		cursor: pointer;
	}
	.err {
		color: #c0392b;
		font-size: 1.1rem;
	}
</style>
