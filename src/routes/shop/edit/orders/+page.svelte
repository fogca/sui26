<script>
	import EditorHead from '$lib/log/EditorHead.svelte';
	import { enhance } from '$app/forms';
	import { yen } from '$lib/shop/money.js';
	import { TIME_SLOTS } from '$lib/shop/stripe.js';
	export let data;

	let open = {};

	const FILTERS = [
		{ key: 'paid', label: '未発送' },
		{ key: 'shipped', label: '発送済み' },
		{ key: 'canceled', label: 'キャンセル' },
		{ key: 'all', label: 'すべて' }
	];
	const STATUS_LABEL = { paid: '未発送', shipped: '発送済み', canceled: 'キャンセル', pending: '処理中', refunded: '返金済み' };

	function slotLabel(v) {
		return TIME_SLOTS.find((t) => t.value === v)?.label ?? v;
	}
	function fmtAddr(a) {
		return `〒${a.zip ?? ''} ${a.state ?? ''}${a.city ?? ''}${a.line1 ?? ''}${a.line2 ? ' ' + a.line2 : ''}`;
	}
</script>

<EditorHead />
<svelte:head><title>受注管理 — Shop</title></svelte:head>

<section class="orders">
	<div class="head">
		<h1 class="serif">受注</h1>
		<div class="acts">
			<a class="csv" href="/shop/api/admin/b2" download>B2用CSV（未発送分）</a>
			<a class="dim" href="/shop/edit">← Dashboard</a>
		</div>
	</div>

	<nav class="filters">
		{#each FILTERS as f}
			<a href="?f={f.key}" class:active={data.filter === f.key}>{f.label}</a>
		{/each}
	</nav>

	<ul class="list">
		{#each data.orders as o (o.id)}
			<li class="order">
				<button class="row" on:click={() => (open[o.id] = !open[o.id])}>
					<span class="mono">{o.order_no}</span>
					<span class="name">{o.name} 様</span>
					<span class="total">{yen(o.total)}</span>
					<span class="date">{o.created_at?.slice(0, 10)}</span>
					{#if o.gift}<span class="gift">🎁</span>{/if}
					<span class="badge {o.status}">{STATUS_LABEL[o.status] ?? o.status}</span>
				</button>

				{#if open[o.id]}
					<div class="detail">
						<div class="cols">
							<div>
								<h3>ご注文内容</h3>
								<ul>
									{#each o.items as i}
										<li>{i.name} × {i.qty} — {yen(i.price * i.qty)}</li>
									{/each}
									<li class="sub">送料 {o.shipping === 0 ? '無料' : yen(o.shipping)}</li>
								</ul>
							</div>
							<div>
								<h3>お届け先</h3>
								<p>{fmtAddr(o.address)}</p>
								<p>{o.phone}</p>
								<p>{o.email}</p>
								{#if o.delivery_note}<p>時間帯: {slotLabel(o.delivery_note)}</p>{/if}
								{#if o.gift}<p>ギフト包装希望</p>{/if}
							</div>
						</div>

						{#if o.status === 'paid'}
							<form method="POST" action="?/ship" use:enhance class="ship-form">
								<input type="hidden" name="id" value={o.id} />
								<input name="tracking" placeholder="追跡番号（任意）" value={o.tracking_no} />
								<button type="submit" class="primary">発送済みにする</button>
							</form>
							<form
								method="POST"
								action="?/cancel"
								use:enhance={({ cancel }) => {
									if (!confirm('この注文をキャンセルしますか？')) cancel();
								}}
								class="cancel-form">
								<input type="hidden" name="id" value={o.id} />
								<label><input type="checkbox" name="restock" checked /> 在庫を戻す</label>
								<button type="submit" class="danger">キャンセル</button>
							</form>
						{:else if o.status === 'shipped'}
							<p class="shipped-note">
								{o.shipped_at?.slice(0, 10)} 発送
								{#if o.tracking_no}／ 追跡番号 {o.tracking_no}{/if}
							</p>
						{/if}

						<form method="POST" action="?/note" use:enhance class="note-form">
							<input type="hidden" name="id" value={o.id} />
							<input name="note" placeholder="メモ" value={o.note} />
							<button type="submit">保存</button>
						</form>
					</div>
				{/if}
			</li>
		{/each}
		{#if data.orders.length === 0}
			<li class="empty">該当する注文はありません。</li>
		{/if}
	</ul>
</section>

<style>
	.orders {
		max-width: 68rem;
		margin: 0 auto;
		padding: calc(8vh + env(safe-area-inset-top)) var(--padding) 8rem;
	}
	.head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 1.2rem;
		margin-bottom: 2rem;
		flex-wrap: wrap;
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
	.csv {
		font-size: 1.1rem;
		color: var(--blackColor);
		border-bottom: 1px solid #ccc;
	}
	.dim {
		font-size: 1.05rem;
		color: var(--subColor);
	}
	.filters {
		display: flex;
		gap: 1.6rem;
		margin-bottom: 2rem;
	}
	.filters a {
		font-size: 1.1rem;
		color: var(--subColor);
		padding-bottom: 0.3rem;
	}
	.filters a.active {
		color: var(--blackColor);
		border-bottom: 1px solid var(--blackColor);
	}
	.order {
		border-bottom: 1px solid #f0eeec;
	}
	.row {
		display: flex;
		align-items: baseline;
		gap: 1.4rem;
		width: 100%;
		padding: 1.2rem 0;
		cursor: pointer;
		text-align: left;
		font-size: 1.15rem;
		color: var(--textColor);
	}
	.mono {
		font-size: 1rem;
		color: var(--subColor);
	}
	.total {
		margin-left: auto;
	}
	.date {
		font-size: 1rem;
		color: var(--subColor);
	}
	.badge {
		font-size: 0.9rem;
		padding: 0.2rem 0.6rem;
		border-radius: 2px;
	}
	.badge.paid {
		background: #f6ead9;
		color: #9a6b2f;
	}
	.badge.shipped {
		background: #edf2ee;
		color: #4a6b52;
	}
	.badge.canceled {
		background: #f3e3e1;
		color: #a04a41;
	}
	.detail {
		padding: 0 0 2rem;
	}
	.cols {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1.6rem;
		margin-bottom: 1.6rem;
	}
	.detail h3 {
		font-size: 1rem;
		color: var(--subColor);
		margin-bottom: 0.6rem;
	}
	.detail li,
	.detail p {
		font-size: 1.15rem;
		line-height: 1.9;
	}
	.detail .sub {
		color: var(--subColor);
	}
	.ship-form,
	.note-form,
	.cancel-form {
		display: flex;
		gap: 1rem;
		margin-top: 1rem;
		align-items: center;
		flex-wrap: wrap;
	}
	.ship-form input[name='tracking'],
	.note-form input[name='note'] {
		flex: 1;
		min-width: 16rem;
		border: 1px solid #ddd;
		padding: 0.7rem;
		font-size: 1.1rem;
		border-radius: 2px;
		background: #fff;
	}
	.primary {
		background: var(--blackColor);
		color: #fff;
		padding: 0.7rem 1.6rem;
		font-size: 1.1rem;
		cursor: pointer;
		border-radius: 3px;
	}
	.cancel-form label {
		font-size: 1rem;
		color: var(--subColor);
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}
	.danger {
		color: #c0392b;
		font-size: 1.05rem;
		cursor: pointer;
	}
	.note-form button {
		font-size: 1.05rem;
		color: var(--textColor);
		border: 1px solid #ddd;
		padding: 0.6rem 1.2rem;
		border-radius: 3px;
		cursor: pointer;
	}
	.shipped-note {
		color: var(--subColor);
		font-size: 1.1rem;
	}
	.empty {
		color: var(--subColor);
		padding: 1.6rem 0;
	}
	.gift {
		font-size: 1rem;
	}

	@media screen and (min-width: 720px) {
		.cols {
			grid-template-columns: 1fr 1fr;
		}
	}
</style>
