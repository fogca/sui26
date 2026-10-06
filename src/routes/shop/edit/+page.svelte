<script>
	// Dashboard: what happened, and what still needs a hand. Everything that
	// needs the owner's attention lives above the fold of the "要対応" block —
	// no number here is a dead end, each one links to where it can be acted on.
	import AdminShell from '$lib/admin/AdminShell.svelte';
	import StatCard from '$lib/admin/StatCard.svelte';
	import Badge from '$lib/admin/Badge.svelte';
	import BarChart from '$lib/admin/BarChart.svelte';
	import EmptyState from '$lib/admin/EmptyState.svelte';
	import { yen } from '$lib/shop/money.js';

	export let data;

	const STATUS = {
		paid: { label: '未発送', tone: 'warn' },
		shipped: { label: '発送済み', tone: 'good' },
		canceled: { label: 'キャンセル', tone: 'neutral' },
		refunded: { label: '返金済み', tone: 'danger' },
		pending: { label: '処理中', tone: 'info' }
	};

	// Operation log rows are stored as machine keys; the owner reads Japanese.
	const ACTION_LABEL = {
		'product.create': '商品を追加',
		'product.update': '商品を更新',
		'product.delete': '商品を削除',
		'product.duplicate': '商品を複製',
		'product.bulk_status': '商品の公開状態を一括変更',
		'stock.adjust': '在庫を調整',
		'order.paid': '注文を受け付け',
		'order.ship': '発送済みにした',
		'order.bulk_ship': 'まとめて発送済みにした',
		'order.cancel': '注文をキャンセル',
		'order.refund': '返金を記録',
		'order.note': '注文メモを更新',
		'order.shipping_edit': 'お届け先を修正',
		'customer.note': '顧客メモを更新',
		'settings.save': '設定を保存'
	};
	const ACTOR_LABEL = { admin: '管理者', system: 'システム' };

	$: stats = data.stats;
	$: hasTodo =
		data.unshipped.length > 0 || data.lowStock.length > 0 || stats.draftCount > 0;
	$: topPeak = data.top.reduce((m, p) => Math.max(m, p.sales), 0);

	function num(n) {
		return Number(n ?? 0).toLocaleString('ja-JP');
	}
	function statusOf(key) {
		return STATUS[key] ?? { label: key, tone: 'neutral' };
	}
	function actionLabel(key) {
		return ACTION_LABEL[key] ?? key;
	}
	function actorLabel(key) {
		return ACTOR_LABEL[key] ?? key ?? '';
	}
	function ageLabel(days) {
		return days === 0 ? '本日' : `${days}日経過`;
	}
	function stockLabel(stock) {
		return stock <= 0 ? '在庫切れ' : `残り${num(stock)}点`;
	}
	function share(v) {
		return topPeak > 0 ? Math.max(2, Math.round((v / topPeak) * 100)) : 0;
	}
</script>

<AdminShell
	title="ダッシュボード"
	section="dashboard"
	subtitle={data.todayLabel}
	badges={{ orders: stats.unshippedCount }}
>
	<span class="head-acts" slot="actions">
		<a class="a-btn" href="/shop/edit/orders">オーダーを見る</a>
		<a class="a-btn primary" href="/shop/edit/products/new">商品を追加</a>
	</span>

	<!-- ----------------------------------------------------------- KPI --- -->
	<div class="kpis">
		<StatCard
			label="今月の売上"
			value={yen(stats.monthSales)}
			delta={data.monthDelta}
			sub="前月 {yen(stats.prevMonthSales)}"
			href="/shop/edit/analytics"
		/>
		<StatCard
			label="今月の注文数"
			value={num(stats.monthCount)}
			unit="件"
			sub="前月 {num(stats.prevMonthCount)}件"
			href="/shop/edit/orders"
		/>
		<StatCard
			label="平均客単価"
			value={yen(stats.avgOrderValue)}
			sub={stats.monthCount > 0 ? `今月の${num(stats.monthCount)}件の平均` : '今月の注文はまだありません'}
		/>
		<StatCard
			label="未発送"
			value={num(stats.unshippedCount)}
			unit="件"
			tone={stats.unshippedCount > 0 ? 'warn' : 'default'}
			href={stats.unshippedCount > 0 ? '/shop/edit/orders?status=paid' : ''}
			sub={stats.unshippedCount > 0
				? data.lateCount > 0
					? `うち${data.warnDays}日以上経過 ${num(data.lateCount)}件`
					: '発送をお待ちのご注文'
				: 'すべて発送済みです'}
		/>
	</div>

	<!-- --------------------------------------------------------- today --- -->
	<p class="today">
		<span class="t-key">今日</span>
		<span>売上 <b>{yen(stats.todaySales)}</b></span>
		<span class="t-sep">/</span>
		<span>注文 <b>{num(stats.todayCount)}</b>件</span>
		{#if stats.monthRefunded > 0}
			<span class="t-sep">/</span>
			<span class="t-note">今月の返金 {yen(stats.monthRefunded)}</span>
		{/if}
	</p>

	<!-- --------------------------------------------------------- chart --- -->
	<section class="sec">
		<div class="sec-head">
			<h2 class="serif">売上推移（{data.range.days}日）</h2>
			<a class="more" href="/shop/edit/analytics">すべて見る →</a>
		</div>
		<div class="a-card">
			<BarChart data={data.chart} height={200} format="yen" />
			<p class="chart-foot">
				合計 <b>{yen(data.range.total)}</b>
				<span class="c-sep">/</span> 注文 <b>{num(data.range.count)}</b>件
				<span class="c-sep">/</span> 1日平均 <b>{yen(data.range.perDay)}</b>
				{#if data.range.peakLabel}
					<span class="c-sep">/</span> 最高 {data.range.peakLabel}
					<b>{yen(data.range.peak)}</b>
				{/if}
			</p>
		</div>
	</section>

	<!-- ----------------------------------------------------------- todo --- -->
	<section class="sec">
		<div class="sec-head">
			<h2 class="serif">要対応</h2>
			{#if hasTodo}<span class="more quiet">上から順に片付ければ大丈夫です</span>{/if}
		</div>

		{#if !hasTodo}
			<div class="a-card clear">
				<p>対応が必要な項目はありません。</p>
				<p class="clear-sub">未発送の注文・在庫切れ・未公開の下書きは、いまのところありません。</p>
			</div>
		{:else}
			<div class="a-card todo">
				{#if data.unshipped.length > 0}
					<div class="tblock">
						<div class="tb-head">
							<h3>未発送の注文<span class="tb-cnt">{num(data.unshippedTotal)}件</span></h3>
							<a class="more" href="/shop/edit/orders?status=paid">すべて見る →</a>
						</div>
						<ul class="tlist">
							{#each data.unshipped as o (o.id)}
								<li>
									<a href="/shop/edit/orders/{o.id}">
										<span class="o-no">{o.order_no}</span>
										<span class="o-name">{o.name} 様</span>
										<span class="o-amt">{yen(o.total)}</span>
										<span class="o-age" class:late={o.late}>{ageLabel(o.days)}</span>
									</a>
								</li>
							{/each}
						</ul>
					</div>
				{/if}

				{#if data.lowStock.length > 0}
					<div class="tblock">
						<div class="tb-head">
							<h3>
								在庫切れ・残りわずか<span class="tb-cnt">{num(data.lowStockTotal)}点</span>
							</h3>
							<a class="more" href="/shop/edit/inventory">すべて見る →</a>
						</div>
						<p class="tb-note">公開中の商品のうち、在庫が{num(data.threshold)}点以下のものです。</p>
						<ul class="tlist">
							{#each data.lowStock as p (p.id)}
								<li>
									<a href="/shop/edit/products/{p.id}">
										<span class="p-name">{p.name}</span>
										<span class="p-stock">
											<Badge
												tone={p.stock <= 0 ? 'danger' : 'warn'}
												label={stockLabel(p.stock)}
											/>
										</span>
									</a>
								</li>
							{/each}
						</ul>
					</div>
				{/if}

				{#if stats.draftCount > 0}
					<div class="tblock">
						<div class="tb-head">
							<h3>下書きのままの商品<span class="tb-cnt">{num(stats.draftCount)}点</span></h3>
							<a class="more" href="/shop/edit/products?status=draft">すべて見る →</a>
						</div>
						<p class="tb-note">
							作成済みですが、まだ公開されていません。公開中は{num(stats.publishedCount)}点です。
						</p>
					</div>
				{/if}
			</div>
		{/if}
	</section>

	<!-- -------------------------------------------------- recent orders --- -->
	<section class="sec">
		<div class="sec-head">
			<h2 class="serif">最近の注文</h2>
			<a class="more" href="/shop/edit/orders">すべて見る →</a>
		</div>

		{#if data.recent.length === 0}
			<EmptyState text="まだご注文はありません。" actionHref="/shop" actionLabel="店を見る" />
		{:else}
			<div class="a-table-scroll">
				<table class="a-table rows">
					<thead>
						<tr>
							<th>注文番号</th>
							<th>お客さま</th>
							<th class="num">点数</th>
							<th class="num">金額</th>
							<th>状態</th>
							<th>オーダー日時</th>
						</tr>
					</thead>
					<tbody>
						{#each data.recent as o (o.id)}
							<tr>
								<td class="strong">
									<a class="rowlink" href="/shop/edit/orders/{o.id}">{o.order_no}</a>
								</td>
								<td>{o.name} 様</td>
								<td class="num">{num(o.qty)}</td>
								<td class="num strong">{yen(o.total)}</td>
								<td><Badge tone={statusOf(o.status).tone} label={statusOf(o.status).label} /></td>
								<td class="a-muted">{o.stamp}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</section>

	<!-- ---------------------------------------------------- top sellers --- -->
	<section class="sec">
		<div class="sec-head">
			<h2 class="serif">売れ筋商品（{data.range.days}日）</h2>
			<a class="more" href="/shop/edit/analytics">すべて見る →</a>
		</div>

		{#if data.top.length === 0}
			<EmptyState text="直近{data.range.days}日の販売はまだありません。" />
		{:else}
			<div class="a-table-scroll">
				<table class="a-table top">
					<thead>
						<tr>
							<th>商品</th>
							<th class="num">数量</th>
							<th class="num">売上</th>
						</tr>
					</thead>
					<tbody>
						{#each data.top as p, i (p.product_id || p.name || i)}
							<tr>
								<td class="strong">
									{#if p.product_id}
										<a href="/shop/edit/products/{p.product_id}">{p.name || '（名称なし）'}</a>
									{:else}
										{p.name || '（名称なし）'}
									{/if}
									<span class="bar" aria-hidden="true">
										<span class="fill" style="width:{share(p.sales)}%"></span>
									</span>
								</td>
								<td class="num">{num(p.qty)}</td>
								<td class="num strong">{yen(p.sales)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</section>

	<!-- -------------------------------------------------------- history --- -->
	<section class="sec last">
		<div class="sec-head">
			<h2 class="serif">最近の操作履歴</h2>
			<span class="more quiet">この画面での変更はすべて記録されます</span>
		</div>

		{#if data.activity.length === 0}
			<EmptyState text="操作履歴はまだありません。" />
		{:else}
			<ul class="log">
				{#each data.activity as a (a.id)}
					<li>
						<span class="l-when">{a.stamp}</span>
						<span class="l-who">{actorLabel(a.actor)}</span>
						<span class="l-what">{actionLabel(a.action)}</span>
						{#if a.target}<span class="l-target">{a.target}</span>{/if}
						{#if a.detail}<span class="l-detail">{a.detail}</span>{/if}
					</li>
				{/each}
			</ul>
		{/if}
	</section>
</AdminShell>

<style>
	/* base.css puts page gutters on every <section> — not wanted inside the shell */
	.sec {
		padding-left: 0;
		padding-right: 0;
		margin-bottom: 4rem;
	}
	.sec.last {
		margin-bottom: 0;
	}
	.sec-head {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.4rem 1.6rem;
		margin-bottom: 1.6rem;
	}
	h2 {
		font-size: 1.6rem;
		line-height: 1.4;
		color: var(--blackColor);
	}
	.more {
		font-size: 1.1rem;
		line-height: 1.6;
		white-space: nowrap;
		color: var(--subColor);
		transition: color 0.18s ease;
	}
	a.more:hover {
		opacity: 1;
		color: var(--blackColor);
	}
	.more.quiet {
		font-size: 1.05rem;
	}

	.head-acts {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.8rem;
	}

	/* ------------------------------------------------------------- KPI --- */
	.kpis {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1.2rem;
	}

	/* ----------------------------------------------------------- today --- */
	.today {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.4rem 0.8rem;
		margin: 1.8rem 0 4rem;
		font-size: 1.15rem;
		line-height: 1.7;
		text-align: left;
		color: var(--subColor);
	}
	.t-key {
		letter-spacing: 0.06em;
	}
	.today b {
		font-weight: 400;
		color: var(--blackColor);
		font-variant-numeric: tabular-nums;
	}
	.t-sep {
		color: #d9d5d1;
	}
	.t-note {
		font-size: 1.05rem;
	}

	/* ----------------------------------------------------------- chart --- */
	.chart-foot {
		margin-top: 1.6rem;
		padding-top: 1.4rem;
		border-top: 1px solid var(--a-line-soft, #f0eeec);
		font-size: 1.1rem;
		line-height: 1.8;
		text-align: left;
		color: var(--subColor);
	}
	.chart-foot b {
		font-weight: 400;
		color: var(--textColor);
		font-variant-numeric: tabular-nums;
	}
	.c-sep {
		color: #d9d5d1;
		padding: 0 0.3rem;
	}

	/* ------------------------------------------------------------ todo --- */
	.clear p {
		font-size: 1.25rem;
		line-height: 1.7;
		text-align: left;
		color: var(--blackColor);
	}
	.clear-sub {
		margin-top: 0.6rem;
		font-size: 1.1rem;
		color: var(--subColor);
	}

	.todo {
		padding-top: 0;
		padding-bottom: 0;
	}
	.tblock {
		padding: 2rem 0;
		border-top: 1px solid var(--a-line-soft, #f0eeec);
	}
	.tblock:first-child {
		border-top: none;
	}
	.tb-head {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.4rem 1.6rem;
	}
	h3 {
		font-size: 1.25rem;
		line-height: 1.5;
		letter-spacing: 0.02em;
		color: var(--blackColor);
	}
	.tb-cnt {
		margin-left: 0.8rem;
		font-size: 1.05rem;
		color: var(--subColor);
		font-variant-numeric: tabular-nums;
	}
	.tb-note {
		margin-top: 0.5rem;
		font-size: 1.05rem;
		line-height: 1.7;
		text-align: left;
		color: var(--subColor);
	}

	.tlist {
		margin-top: 1rem;
	}
	.tlist a {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.3rem 1.2rem;
		padding: 0.9rem 0;
		border-bottom: 1px solid var(--a-line-soft, #f0eeec);
		font-size: 1.15rem;
		line-height: 1.5;
		color: var(--textColor);
		transition: color 0.18s ease;
	}
	.tlist li:last-child a {
		border-bottom: none;
		padding-bottom: 0;
	}
	.tlist a:hover {
		opacity: 1;
		color: var(--blackColor);
	}
	.o-no {
		flex: none;
		min-width: 13rem;
		font-size: 1.05rem;
		letter-spacing: 0.04em;
		color: var(--subColor);
		font-variant-numeric: tabular-nums;
	}
	.o-name {
		flex: 1 1 12rem;
		min-width: 0;
		color: var(--blackColor);
	}
	.o-amt {
		flex: none;
		font-variant-numeric: tabular-nums;
	}
	/* colour reinforces the word, it never carries the meaning alone */
	.o-age {
		flex: none;
		min-width: 6.5rem;
		text-align: right;
		font-size: 1.05rem;
		color: var(--subColor);
		font-variant-numeric: tabular-nums;
	}
	.o-age.late {
		color: var(--a-warn, #8a6224);
	}
	.p-name {
		flex: 1 1 auto;
		min-width: 0;
		color: var(--blackColor);
	}
	.p-stock {
		flex: none;
	}

	/* ----------------------------------------------------------- table --- */
	/* whole-row target: the anchor stretches over its row, keyboard still lands
	   on the link itself */
	.rows tbody tr {
		position: relative;
	}
	.rowlink {
		letter-spacing: 0.04em;
		font-variant-numeric: tabular-nums;
	}
	.rowlink::after {
		content: '';
		position: absolute;
		inset: 0;
	}

	.top .bar {
		display: block;
		width: min(24rem, 100%);
		height: 4px;
		margin-top: 0.7rem;
		border-radius: 2px;
		background-color: #f2f0ee;
		overflow: hidden;
	}
	.top .fill {
		display: block;
		height: 100%;
		border-radius: 0 2px 2px 0;
		background-color: rgba(72, 72, 72, 0.5);
	}

	/* --------------------------------------------------------- history --- */
	.log li {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.3rem 1rem;
		padding: 0.9rem 0;
		border-bottom: 1px solid var(--a-line-soft, #f0eeec);
		font-size: 1.1rem;
		line-height: 1.6;
	}
	.log li:last-child {
		border-bottom: none;
	}
	.l-when {
		flex: none;
		min-width: 8.5rem;
		color: var(--subColor);
		font-variant-numeric: tabular-nums;
	}
	.l-who {
		flex: none;
		min-width: 5rem;
		color: var(--subColor);
	}
	.l-what {
		color: var(--blackColor);
	}
	.l-target,
	.l-detail {
		min-width: 0;
		color: var(--subColor);
		overflow-wrap: anywhere;
	}

	/* ---------------------------------------------------------- ≥900px --- */
	@media screen and (min-width: 900px) {
		.sec {
			margin-bottom: 5.6rem;
		}
		.kpis {
			grid-template-columns: repeat(4, 1fr);
		}
		.today {
			margin: 2.4rem 0 5.6rem;
			gap: 0.4rem 1.2rem;
		}
		.tblock {
			padding: 2.4rem 0;
		}
	}
</style>
