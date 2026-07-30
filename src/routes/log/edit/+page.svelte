<script>
	import EditorHead from '$lib/log/EditorHead.svelte';
	export let data;

	async function logout() {
		await fetch('/log/api/logout', { method: 'POST' });
		location.href = '/log/login';
	}
</script>

<EditorHead />
<svelte:head><title>log editor</title></svelte:head>

<section class="editor-index">
	<div class="head">
		<h1 class="serif">log editor</h1>
		<div class="head-actions">
			<a class="new" href="/log/new">＋ 新規ページ</a>
			<a class="shop-link" href="/shop/edit">Shop管理</a>
			<button class="logout" on:click={logout}>ログアウト</button>
		</div>
	</div>

	<ul class="pages">
		{#each data.pages as p (p.slug)}
			<li>
				<a href="/log/{p.slug}/edit">
					<span class="badge {p.status}">{p.status === 'published' ? '公開' : '下書き'}</span>
					{#if p.needs_publish}<span class="badge pending">未反映</span>{/if}
					<span class="date">{p.date}</span>
					<span class="title serif">{p.title}</span>
				</a>
			</li>
		{/each}
		{#if data.pages.length === 0}
			<li class="empty">まだページがありません。</li>
		{/if}
	</ul>
</section>

<style>
	.editor-index {
		max-width: 52rem;
		margin: 0 auto;
		padding-top: calc(12vh + env(safe-area-inset-top));
		padding-bottom: calc(8rem + env(safe-area-inset-bottom));
	}
	.head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		margin-bottom: 3rem;
		gap: 1.2rem;
	}
	h1 {
		font-size: 2rem;
		letter-spacing: 0.05em;
	}
	.head-actions {
		display: flex;
		align-items: baseline;
		gap: 1.6rem;
	}
	.new {
		font-size: 1.2rem;
		color: var(--blackColor);
	}
	.shop-link {
		font-size: 1.1rem;
		color: var(--textColor);
	}
	.logout {
		font-size: 1.05rem;
		color: var(--subColor);
		cursor: pointer;
	}
	.pages {
		display: flex;
		flex-direction: column;
	}
	.pages li a {
		display: flex;
		align-items: baseline;
		gap: 1.2rem;
		padding: 1.4rem 0;
		border-bottom: 1px solid #eee;
		width: 100%;
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
	.badge.pending {
		background: #f6ead9;
		color: #9a6b2f;
	}
	.date {
		font-size: 1rem;
		color: var(--subColor);
		flex: 0 0 auto;
	}
	.title {
		font-size: 1.4rem;
	}
	.empty {
		color: var(--subColor);
		padding: 1.4rem 0;
	}

	@media (max-width: 719px) {
		.editor-index {
			padding-left: var(--padding);
			padding-right: var(--padding);
		}
	}
</style>
