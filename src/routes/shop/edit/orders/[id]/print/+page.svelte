<script>
	// Packing slip. Independent of AdminShell: this page exists to become paper.
	// A4 portrait, @page margin 15mm, everything chrome-like hidden on print.
	import EditorHead from '$lib/log/EditorHead.svelte';
	import { yen } from '$lib/shop/money.js';
	import { TIME_SLOTS } from '$lib/shop/stripe.js';

	export let data;

	const dtf = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tokyo' });
	function day(iso) {
		if (!iso) return '—';
		const d = new Date(iso);
		return Number.isNaN(d.getTime()) ? '—' : dtf.format(d).replaceAll('-', '.');
	}

	$: order = data.order;
	$: s = data.settings;
	$: addr = order.address ?? {};
	$: items = order.items ?? [];
	$: refunded = Number(order.refunded_amount ?? 0);
	$: sellerName = s.legal_seller || s.store_name || 'SUI scent studio';
	// Settings may still be empty — never point the customer at a blank block.
	$: contact = s.sender_tel || s.legal_email || s.store_email || '';

	function slotLabel(v) {
		if (!v || v === 'none') return '';
		const hit = TIME_SLOTS.find((t) => t.value === v);
		return hit ? hit.label : v;
	}

	function print() {
		window.print();
	}
</script>

<EditorHead />
<svelte:head>
	<title>納品書 {order.order_no} — SUI shop</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="stage">
	<div class="bar no-print">
		<a class="btn ghost" href="/shop/edit/orders/{order.id}">← オーダー詳細に戻る</a>
		<button class="btn" type="button" on:click={print}>印刷</button>
	</div>

	<div class="sheet">
		<header class="head">
			<div class="brand">
				<p class="mark serif">SUI scent studio</p>
				<p class="tagline">by sari</p>
			</div>
			<div class="doc">
				<h1 class="serif">納品書</h1>
				<dl>
					<div><dt>注文番号</dt><dd>{order.order_no}</dd></div>
					<div><dt>注文日</dt><dd>{day(order.created_at)}</dd></div>
					{#if order.shipped_at}
						<div><dt>発送日</dt><dd>{day(order.shipped_at)}</dd></div>
					{/if}
					<div><dt>発行日</dt><dd>{day(new Date().toISOString())}</dd></div>
				</dl>
			</div>
		</header>

		<div class="parties">
			<section class="to">
				{#if addr.zip}<p class="line zip">〒{addr.zip}</p>{/if}
				<p class="line">{addr.state ?? ''}{addr.city ?? ''}{addr.line1 ?? ''}</p>
				{#if addr.line2}<p class="line">{addr.line2}</p>{/if}
				<p class="name">{order.name} <span class="sama">様</span></p>
			</section>

			<section class="from">
				<p class="from-name">{sellerName}</p>
				{#if s.sender_zip}<p class="line">〒{s.sender_zip}</p>{/if}
				{#if s.sender_addr}<p class="line">{s.sender_addr}</p>{/if}
				{#if s.sender_tel}<p class="line">TEL {s.sender_tel}</p>{/if}
				{#if s.legal_email || s.store_email}
					<p class="line">{s.legal_email || s.store_email}</p>
				{/if}
				{#if s.store_url}<p class="line">{s.store_url}</p>{/if}
			</section>
		</div>

		<p class="thanks">この度はご購入いただき、誠にありがとうございます。</p>

		<table class="items">
			<thead>
				<tr>
					<th class="c-name">品名</th>
					<th class="c-num">単価</th>
					<th class="c-num">数量</th>
					<th class="c-num">金額</th>
				</tr>
			</thead>
			<tbody>
				{#each items as it, i (it.product_id ?? i)}
					<tr>
						<td class="c-name">{it.name}</td>
						<td class="c-num">{yen(it.price)}</td>
						<td class="c-num">{it.qty}</td>
						<td class="c-num">{yen(it.price * it.qty)}</td>
					</tr>
				{/each}
			</tbody>
		</table>

		<div class="foot">
			<div class="notes">
				{#if slotLabel(order.delivery_note)}
					<p class="line">配達時間帯: {slotLabel(order.delivery_note)}</p>
				{/if}
				{#if order.gift}<p class="line">ギフト包装をご指定いただいております。</p>{/if}
				{#if order.tracking_no}<p class="line">お問い合わせ伝票番号: {order.tracking_no}</p>{/if}
				{#if s.tax_note}<p class="line dim">{s.tax_note}</p>{/if}
			</div>

			<dl class="totals">
				<div><dt>小計</dt><dd>{yen(order.subtotal)}</dd></div>
				<div><dt>送料</dt><dd>{order.shipping === 0 ? '無料' : yen(order.shipping)}</dd></div>
				<div class="grand"><dt>合計</dt><dd>{yen(order.total)}</dd></div>
				{#if refunded > 0}
					<div><dt>返金済み</dt><dd>− {yen(refunded)}</dd></div>
					<div><dt>差引</dt><dd>{yen(Number(order.total) - refunded)}</dd></div>
				{/if}
			</dl>
		</div>

		<p class="closing">
			{#if contact}
				商品に不備がございましたら、お手数ですが {contact} までご一報ください。
			{:else}
				商品に不備がございましたら、お手数ですがご注文時のメールへご返信ください。
			{/if}
		</p>
	</div>
</div>

<style>
	/* A4 portrait with a 15mm gutter on every side. No selector, so Svelte's
	   scoper passes this through untouched. */
	@page {
		size: A4 portrait;
		margin: 15mm;
	}

	/* Sizes are in pt so the screen preview and the paper agree. */
	.stage {
		min-height: 100vh;
		padding: 2.4rem 1.8rem 8rem;
		background-color: #f2f1ef;
	}

	.bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1.2rem;
		width: min(210mm, 100%);
		margin: 0 auto 2rem;
	}
	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-family: inherit;
		font-size: 1.1rem;
		line-height: 1;
		letter-spacing: 0.02em;
		padding: 0.85rem 1.6rem;
		border: 1px solid var(--blackColor);
		border-radius: 3px;
		background-color: var(--blackColor);
		color: var(--backgroundColor);
		cursor: pointer;
	}
	.btn.ghost {
		background-color: transparent;
		border-color: transparent;
		color: var(--subColor);
		padding-left: 0;
	}

	.sheet {
		width: min(210mm, 100%);
		margin: 0 auto;
		padding: 15mm;
		background-color: #fff;
		border: 1px solid #e6e4e1;
		color: #1a1a1a;
	}

	/* ----------------------------------------------------------- head --- */
	.head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 12mm;
		padding-bottom: 6mm;
		border-bottom: 1px solid #1a1a1a;
	}
	.mark {
		font-size: 15pt;
		line-height: 1.2;
		letter-spacing: 0.06em;
		color: #1a1a1a;
	}
	.tagline {
		margin-top: 1.5mm;
		font-size: 8pt;
		line-height: 1.4;
		letter-spacing: 0.14em;
		text-align: left;
		color: #8a8a8a;
	}
	.doc {
		text-align: right;
	}
	h1 {
		font-size: 14pt;
		line-height: 1.2;
		letter-spacing: 0.18em;
		color: #1a1a1a;
		margin-bottom: 3mm;
	}
	.doc dl {
		display: flex;
		flex-direction: column;
		gap: 1mm;
	}
	.doc dl div {
		display: flex;
		justify-content: flex-end;
		gap: 4mm;
	}
	.doc dt {
		font-size: 8pt;
		line-height: 1.4;
		color: #8a8a8a;
	}
	.doc dd {
		font-size: 9pt;
		line-height: 1.4;
		color: #1a1a1a;
		font-variant-numeric: tabular-nums;
		min-width: 26mm;
		text-align: right;
	}

	/* -------------------------------------------------------- parties --- */
	.parties {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 12mm;
		margin-top: 8mm;
	}
	.to {
		flex: 1 1 auto;
		max-width: 95mm;
	}
	.from {
		flex: 0 0 auto;
		max-width: 70mm;
		text-align: right;
	}
	.line {
		font-size: 9pt;
		line-height: 1.7;
		text-align: inherit;
		color: #1a1a1a;
	}
	.to .line {
		text-align: left;
	}
	.from .line {
		text-align: right;
		color: #545454;
	}
	.zip {
		letter-spacing: 0.04em;
	}
	.name {
		margin-top: 3mm;
		padding-bottom: 2mm;
		border-bottom: 1px solid #1a1a1a;
		font-size: 13pt;
		line-height: 1.5;
		text-align: left;
		color: #1a1a1a;
	}
	.sama {
		font-size: 10pt;
		margin-left: 1.5mm;
	}
	.from-name {
		font-size: 10pt;
		line-height: 1.6;
		text-align: right;
		color: #1a1a1a;
		margin-bottom: 1mm;
	}

	.thanks {
		margin-top: 10mm;
		font-size: 9.5pt;
		line-height: 1.8;
		text-align: left;
		color: #1a1a1a;
	}

	/* ---------------------------------------------------------- items --- */
	.items {
		width: 100%;
		border-collapse: collapse;
		margin-top: 6mm;
	}
	.items th {
		font-size: 8pt;
		font-weight: 400;
		line-height: 1.4;
		letter-spacing: 0.06em;
		color: #8a8a8a;
		text-align: left;
		padding: 0 4mm 2mm 0;
		border-bottom: 1px solid #1a1a1a;
	}
	.items td {
		font-size: 9.5pt;
		line-height: 1.6;
		color: #1a1a1a;
		padding: 3mm 4mm 3mm 0;
		border-bottom: 1px solid #e2e0dd;
		vertical-align: top;
	}
	.items th:last-child,
	.items td:last-child {
		padding-right: 0;
	}
	.c-num {
		text-align: right;
		white-space: nowrap;
		font-variant-numeric: tabular-nums;
	}
	.items th.c-num {
		text-align: right;
	}
	.c-name {
		width: 100%;
	}

	/* ----------------------------------------------------------- foot --- */
	.foot {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 12mm;
		margin-top: 6mm;
	}
	.notes {
		flex: 1 1 auto;
		padding-top: 1mm;
	}
	.notes .line {
		font-size: 8.5pt;
		line-height: 1.8;
		color: #545454;
	}
	.notes .dim {
		color: #8a8a8a;
	}
	.totals {
		flex: 0 0 auto;
		width: 62mm;
		display: flex;
		flex-direction: column;
		gap: 2mm;
	}
	.totals div {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 6mm;
	}
	.totals dt {
		font-size: 9pt;
		color: #545454;
	}
	.totals dd {
		font-size: 9.5pt;
		color: #1a1a1a;
		font-variant-numeric: tabular-nums;
	}
	.totals .grand {
		margin-top: 1mm;
		padding-top: 2.5mm;
		border-top: 1px solid #1a1a1a;
	}
	.totals .grand dt {
		font-size: 10pt;
		color: #1a1a1a;
	}
	.totals .grand dd {
		font-size: 13pt;
	}

	.closing {
		margin-top: 12mm;
		padding-top: 4mm;
		border-top: 1px solid #e2e0dd;
		font-size: 8.5pt;
		line-height: 1.8;
		text-align: left;
		color: #8a8a8a;
	}

	@media screen and (max-width: 560px) {
		.head,
		.parties,
		.foot {
			flex-direction: column;
			gap: 8mm;
		}
		.doc,
		.from,
		.from .line,
		.from-name {
			text-align: left;
		}
		.doc dl div {
			justify-content: flex-start;
		}
		.doc dd {
			text-align: left;
		}
		.totals {
			width: 100%;
		}
	}

	/* ---------------------------------------------------------- print --- */
	@media print {
		:global(html),
		:global(body) {
			width: auto;
			background-color: #fff;
		}
		.no-print {
			display: none !important;
		}
		.stage {
			min-height: 0;
			padding: 0;
			background-color: #fff;
		}
		.sheet {
			width: auto;
			margin: 0;
			padding: 0;
			border: 0;
		}
		.items {
			page-break-inside: auto;
		}
		.items tr {
			page-break-inside: avoid;
		}
		.foot,
		.closing {
			page-break-inside: avoid;
		}
	}
</style>
