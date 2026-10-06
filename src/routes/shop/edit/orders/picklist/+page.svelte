<script>
	// A sheet of paper for one person walking the shelves: item, 品番, total
	// quantity, and which orders it belongs to. Never per-order lines.
	import AdminShell from '$lib/admin/AdminShell.svelte';
	import EmptyState from '$lib/admin/EmptyState.svelte';
	import { FIELD } from '$lib/shop/vocab.js';

	export let data;

	const dtf = new Intl.DateTimeFormat('sv-SE', {
		timeZone: 'Asia/Tokyo',
		dateStyle: 'short',
		timeStyle: 'short'
	});
	const printedAt = dtf.format(new Date());

	function doPrint() {
		window.print();
	}
</script>

<AdminShell
	title="ピックリスト"
	section="orders"
	subtitle="未発送のオーダーをアイテム単位でまとめた棚出し表"
>
	<div slot="actions" class="head-acts no-print">
		<a class="a-btn" href="/shop/edit/orders">オーダー一覧へ戻る</a>
		{#if data.rows.length}
			<button class="a-btn primary" type="button" on:click={doPrint}>印刷</button>
		{/if}
	</div>

	{#if !data.rows.length}
		<EmptyState text="未発送のオーダーはありません。" actionHref="/shop/edit/orders" actionLabel="オーダー一覧へ" />
	{:else}
		<div class="sheet">
			<header class="head only-print">
				<p class="h-ttl serif">ピックリスト</p>
				<p class="h-sub">{printedAt} 時点</p>
			</header>

			<p class="summary">
				未発送 <span class="a-num">{data.orderCount}</span> 件 ／ 総ピック数
				<span class="a-num">{data.totalQty}</span> 点
			</p>

			<div class="a-table-scroll">
				<table class="a-table pick">
					<thead>
						<tr>
							<th class="c-check no-print"></th>
							<th>アイテム名</th>
							<th>{FIELD.sku}</th>
							<th class="num">合計数量</th>
							<th>該当オーダー</th>
						</tr>
					</thead>
					<tbody>
						{#each data.rows as r (r.key)}
							<tr>
								<td class="c-check no-print"><input type="checkbox" aria-label="{r.name} をピック済みにする" /></td>
								<td class="strong">{r.name}</td>
								<td class="a-num dim">{r.sku || '—'}</td>
								<td class="num qty a-num">{r.qty}</td>
								<td class="ords">{r.orders.join('、')}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}
</AdminShell>

<style>
	.head-acts {
		display: flex;
		flex-wrap: wrap;
		gap: 0.8rem;
	}
	.only-print {
		display: none;
	}
	.summary {
		margin-bottom: 1.6rem;
		font-size: 1.15rem;
		line-height: 1.7;
		text-align: left;
		color: var(--subColor);
	}
	.pick .c-check {
		width: 3.4rem;
	}
	.pick .qty {
		font-size: 1.5rem;
		color: var(--blackColor);
		font-variant-numeric: tabular-nums;
	}
	.pick .strong {
		color: var(--blackColor);
	}
	.dim {
		color: var(--subColor);
	}
	.ords {
		font-size: 1.05rem;
		line-height: 1.6;
		color: var(--subColor);
		word-break: break-all;
	}

	/* ------------------------------------------------------------ print --- */
	@page {
		margin: 15mm;
	}
	@media print {
		.only-print {
			display: block;
			margin-bottom: 8mm;
		}
		.h-ttl {
			font-size: 16pt;
			color: #000;
		}
		.h-sub {
			margin-top: 2mm;
			font-size: 9pt;
			text-align: left;
			color: #555;
		}
		.summary {
			font-size: 9pt;
			color: #555;
		}
		.pick .qty {
			font-size: 12pt;
		}
		.ords {
			font-size: 8pt;
		}
		/* The shell's chrome must not reach paper. */
		:global(.admin .topbar),
		:global(.admin .side),
		:global(.admin .scrim),
		:global(.admin .main > .head),
		.no-print {
			display: none !important;
		}
		:global(html),
		:global(body),
		:global(.admin),
		:global(.admin .main),
		:global(.admin .content) {
			margin: 0 !important;
			padding: 0 !important;
			background: #fff !important;
			min-height: 0 !important;
		}
	}
</style>
