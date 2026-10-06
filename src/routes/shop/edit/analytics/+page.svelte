<script>
	// Analytics. Single-hue marks only: every chart plots one series, so color
	// carries no identity and never competes with the numbers.
	import AdminShell from '$lib/admin/AdminShell.svelte';
	import StatCard from '$lib/admin/StatCard.svelte';
	import Toolbar from '$lib/admin/Toolbar.svelte';
	import Section from '$lib/admin/Section.svelte';
	import BarChart from '$lib/admin/BarChart.svelte';
	import EmptyState from '$lib/admin/EmptyState.svelte';
	import { yen } from '$lib/shop/money.js';

	export let data;

	const RANGES = [
		{ days: 7, label: '7日' },
		{ days: 30, label: '30日' },
		{ days: 90, label: '90日' }
	];

	$: days = data.days;
	$: s = data.summary;
	$: hasData = s.count > 0 || s.sales > 0;

	$: rangeText = rangeLabel(data.range.from, data.range.to);
	$: prevRangeText = rangeLabel(data.range.prevFrom, data.range.prevTo);

	$: dailyData = data.series.map((d) => ({ label: mdLabel(d.date), value: d.sales }));
	$: weekdayData = data.weekdays.map((d) => ({ label: d.label, value: d.avg }));
	$: bestWeekday = pickBestWeekday(data.weekdays);

	// summary tiles — the comparison is against the period immediately before,
	// never "前月比", so it is spelled out rather than using StatCard's delta
	$: cards = buildCards(s, days);

	$: customerRows = [
		{ key: 'fresh', label: '新規（1回のみ）', ...data.customers.fresh },
		{ key: 'repeat', label: 'リピーター（2回以上）', ...data.customers.repeat }
	];
	$: customerTotalSales = customerRows.reduce((n, r) => n + r.sales, 0);
	$: customerTotalCount = customerRows.reduce((n, r) => n + r.customers, 0);

	function jpDate(ymd) {
		const [, m, d] = String(ymd).split('-');
		return `${Number(m)}月${Number(d)}日`;
	}
	function mdLabel(ymd) {
		const [, m, d] = String(ymd).split('-');
		return `${Number(m)}/${Number(d)}`;
	}
	function rangeLabel(from, to) {
		const fy = String(from).slice(0, 4);
		const ty = String(to).slice(0, 4);
		return fy === ty
			? `${fy}年 ${jpDate(from)} 〜 ${jpDate(to)}`
			: `${fy}年${jpDate(from)} 〜 ${ty}年${jpDate(to)}`;
	}
	function fmtPct(n) {
		return (Math.round(Math.abs(n) * 10) / 10).toLocaleString('ja-JP') + '%';
	}
	/**
	 * Direction is carried by an arrow, never by color alone.
	 * A zero previous period has no percentage to state — the tile then just
	 * names what the previous period was, rather than printing a fake ∞%.
	 */
	function compare(cur, prev, invert = false) {
		const c = Number(cur) || 0;
		const p = Number(prev) || 0;
		if (p === 0) return { text: '', tone: 'flat' };
		const pct = ((c - p) / p) * 100;
		const dir = pct > 0.05 ? 'up' : pct < -0.05 ? 'down' : 'flat';
		if (dir === 'flat') return { text: '± 0%', tone: 'flat' };
		return {
			text: `${dir === 'up' ? '↑' : '↓'} ${fmtPct(pct)}`,
			tone: (dir === 'up') !== invert ? 'good' : 'bad'
		};
	}
	function buildCards(sum, span) {
		const card = (label, value, unit, cur, prev, prevText, invert = false) => {
			const cmp = compare(cur, prev, invert);
			return {
				label,
				value,
				unit,
				cmp,
				vs: cmp.text ? `前の${span}日間 ${prevText}` : `前の${span}日間は ${prevText}`,
				tone: 'default'
			};
		};
		return [
			card('期間の売上', yen(sum.sales), '', sum.sales, sum.prevSales, yen(sum.prevSales)),
			card(
				'注文数',
				Number(sum.count).toLocaleString('ja-JP'),
				'件',
				sum.count,
				sum.prevCount,
				`${Number(sum.prevCount).toLocaleString('ja-JP')}件`
			),
			card('平均客単価', yen(sum.avg), '', sum.avg, sum.prevAvg, yen(sum.prevAvg)),
			// more refunds is worse, so the direction reads inverted
			{
				...card(
					'返金額',
					yen(sum.refunded),
					'',
					sum.refunded,
					sum.prevRefunded,
					yen(sum.prevRefunded),
					true
				),
				tone: sum.refunded > 0 ? 'warn' : 'default'
			}
		];
	}
	function pctOf(v, total) {
		return total > 0 ? ((Number(v) || 0) / total) * 100 : 0;
	}
	function pctText(v, total) {
		return fmtPct(pctOf(v, total));
	}
	function pickBestWeekday(rows) {
		const live = (rows ?? []).filter((r) => r.days > 0 && r.avg > 0);
		if (!live.length) return null;
		return live.reduce((best, r) => (r.avg > best.avg ? r : best), live[0]);
	}
</script>

<AdminShell title="分析" section="analytics" subtitle="売れ方の傾向を、期間で切り替えて確認します">
	<span slot="actions">
		<a class="a-btn ghost" href="/shop/edit/orders">オーダー一覧 →</a>
	</span>

	<Toolbar>
		<span class="tb-label">期間</span>
		<div class="seg" role="group" aria-label="集計期間">
			{#each RANGES as r (r.days)}
				<a
					class="seg-btn"
					class:on={r.days === days}
					href="?days={r.days}"
					aria-current={r.days === days ? 'true' : undefined}>{r.label}</a
				>
			{/each}
		</div>
		<span class="spacer"></span>
		<span class="a-muted range">{rangeText}</span>
	</Toolbar>

	<div class="a-grid kpis">
		{#each cards as c (c.label)}
			<StatCard label={c.label} value={c.value} unit={c.unit} tone={c.tone}>
				<span class="cmp">
					{#if c.cmp.text}<span class="cmp-v {c.cmp.tone}">{c.cmp.text}</span>{/if}
					<span class="cmp-vs">{c.vs}</span>
				</span>
			</StatCard>
		{/each}
	</div>

	{#if !hasData}
		<EmptyState
			text="この期間のデータはありません。"
			actionHref="/shop/edit/orders"
			actionLabel="オーダー一覧を見る"
		/>
	{:else}
		<Section title="売上推移" desc="{rangeText}（{days}日間）の日別売上です。注文のなかった日も0として並べています。">
			<div class="a-card chart-card">
				<BarChart data={dailyData} height={200} format="yen" />
			</div>
		</Section>

		<Section
			title="曜日別の傾向"
			desc="期間内の曜日ごとの平均売上です。告知や再入荷を出す曜日を決める目安になります。"
		>
			<div class="a-card chart-card">
				<BarChart data={weekdayData} height={160} format="yen" />
			</div>
			{#if bestWeekday}
				<p class="lede">
					この{days}日間でいちばん売れているのは<strong>{bestWeekday.label}曜日</strong>（平均
					{yen(bestWeekday.avg)} / 対象 {bestWeekday.days}日）です。
				</p>
			{/if}
		</Section>

		<Section title="商品別売上ランキング" desc="{rangeText}に売れた商品の合計です。送料は含みません。">
			{#if data.products.rows.length === 0}
				<EmptyState text="この期間に売れた商品はありません。" />
			{:else}
				<div class="a-table-scroll">
					<table class="a-table rank">
						<thead>
							<tr>
								<th class="col-no">#</th>
								<th>商品</th>
								<th class="num">販売数</th>
								<th class="num">売上</th>
								<th class="col-share">構成比</th>
							</tr>
						</thead>
						<tbody>
							{#each data.products.rows as p, i (p.product_id || p.name || i)}
								<tr>
									<td class="col-no a-muted a-num">{i + 1}</td>
									<td class="strong">
										{#if p.product_id}
											<a href="/shop/edit/products/{p.product_id}">{p.name || '（名称なし）'}</a>
										{:else}
											{p.name || '（名称なし）'}
										{/if}
									</td>
									<td class="num">{Number(p.qty).toLocaleString('ja-JP')}</td>
									<td class="num">{yen(p.sales)}</td>
									<td class="col-share">
										<span class="share">
											<span class="share-track">
												<span
													class="share-fill"
													style="width:{Math.max(1, pctOf(p.sales, data.products.total))}%"
												></span>
											</span>
											<span class="share-pct a-num">{pctText(p.sales, data.products.total)}</span>
										</span>
									</td>
								</tr>
							{/each}
						</tbody>
						{#if data.products.moreCount > 0}
							<tfoot>
								<tr>
									<td class="col-no"></td>
									<td class="a-muted">ほか {data.products.moreCount} 商品</td>
									<td class="num a-muted">—</td>
									<td class="num a-muted">{yen(data.products.moreSales)}</td>
									<td class="col-share a-muted a-num">
										{pctText(data.products.moreSales, data.products.total)}
									</td>
								</tr>
							</tfoot>
						{/if}
					</table>
				</div>
			{/if}
		</Section>
	{/if}

	<Section
		title="新規とリピーター"
		desc="購入回数で顧客をふたつに分けたものです。顧客は全期間の集計で、上の期間指定は反映されません（金額は返金分を差し引いた実績）。"
	>
		{#if customerTotalCount === 0}
			<EmptyState text="まだ顧客データがありません。" />
		{:else}
			<div class="a-card">
				<div
					class="split"
					role="img"
					aria-label="売上の内訳。新規 {pctText(
						data.customers.fresh.sales,
						customerTotalSales
					)}、リピーター {pctText(data.customers.repeat.sales, customerTotalSales)}"
				>
					{#each customerRows as r (r.key)}
						{#if r.sales > 0}
							<span class="seg-fill {r.key}" style="flex-grow:{r.sales}"></span>
						{/if}
					{/each}
				</div>

				<ul class="legend">
					{#each customerRows as r (r.key)}
						<li>
							<span class="sw {r.key}"></span>
							<span class="lg-label">{r.label}</span>
							<span class="lg-pct a-num">{pctText(r.sales, customerTotalSales)}</span>
							<span class="lg-sub a-muted">{yen(r.sales)}</span>
						</li>
					{/each}
				</ul>

				<div class="a-table-scroll">
					<table class="a-table">
						<thead>
							<tr>
								<th>区分</th>
								<th class="num">顧客数</th>
								<th class="num">注文数</th>
								<th class="num">売上</th>
								<th class="num">売上構成比</th>
							</tr>
						</thead>
						<tbody>
							{#each customerRows as r (r.key)}
								<tr>
									<td class="strong">{r.label}</td>
									<td class="num">{r.customers.toLocaleString('ja-JP')}</td>
									<td class="num">{r.orders.toLocaleString('ja-JP')}</td>
									<td class="num">{yen(r.sales)}</td>
									<td class="num">{pctText(r.sales, customerTotalSales)}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/if}
	</Section>

	<p class="note">
		売上は「入金済」「発送済」の注文の合計です。キャンセル・返金となった注文は売上から除外しています。
		日付はすべて日本時間（JST）で集計しています。前期間は {prevRangeText} です。
	</p>
</AdminShell>

<style>
	/* ------------------------------------------------------------ toolbar --- */
	.tb-label {
		font-size: 1.05rem;
		letter-spacing: 0.04em;
		color: var(--subColor);
	}
	.seg {
		display: flex;
		align-items: center;
		border: 1px solid var(--a-line-strong, #e4e1de);
		border-radius: 3px;
		overflow: hidden;
		background-color: #fff;
	}
	.seg-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 6rem;
		padding: 0.75rem 1.2rem;
		font-size: 1.1rem;
		line-height: 1;
		letter-spacing: 0.02em;
		color: var(--textColor);
		border-left: 1px solid #f0eeec;
		transition:
			background-color 0.18s ease,
			color 0.18s ease;
	}
	.seg-btn:first-child {
		border-left: none;
	}
	.seg-btn:hover {
		opacity: 1;
		background-color: rgba(0, 0, 0, 0.02);
		color: var(--blackColor);
	}
	.seg-btn.on {
		background-color: var(--blackColor);
		color: var(--backgroundColor);
	}
	.range {
		font-size: 1.05rem;
		letter-spacing: 0.02em;
		font-variant-numeric: tabular-nums;
	}

	/* ---------------------------------------------------------------- kpi --- */
	/* four tiles read as one row or two even rows — never 3 + 1 */
	.kpis {
		grid-template-columns: repeat(2, minmax(0, 1fr));
		margin-bottom: 4rem;
	}
	@media screen and (max-width: 519px) {
		.kpis {
			grid-template-columns: minmax(0, 1fr);
		}
	}
	@media screen and (min-width: 1150px) {
		.kpis {
			grid-template-columns: repeat(4, minmax(0, 1fr));
		}
	}
	/* slotted into StatCard, so it is styled from here */
	.cmp {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.5rem;
		font-size: 1.05rem;
		line-height: 1.5;
	}
	.cmp-v {
		font-variant-numeric: tabular-nums;
		color: var(--subColor);
	}
	.cmp-v.good {
		color: #4d6b57;
	}
	.cmp-v.bad {
		color: #a3453a;
	}
	.cmp-vs {
		color: var(--subColor);
		font-variant-numeric: tabular-nums;
	}

	/* -------------------------------------------------------------- chart --- */
	.chart-card {
		padding: 2rem 1.6rem 1.6rem;
	}
	.lede {
		margin-top: 1.4rem;
		font-size: 1.15rem;
		line-height: 1.8;
		text-align: left;
		color: var(--textColor);
	}
	.lede strong {
		color: var(--blackColor);
	}

	/* --------------------------------------------------------------- rank --- */
	.col-no {
		width: 3.2rem;
		padding-right: 0.8rem;
	}
	.rank td.col-no {
		font-size: 1.05rem;
	}
	.col-share {
		width: 34%;
		min-width: 14rem;
	}
	.share {
		display: flex;
		align-items: center;
		gap: 0.9rem;
	}
	.share-track {
		flex: 1 1 auto;
		height: 6px;
		border-radius: 2px;
		background-color: #f2f0ee;
		overflow: hidden;
	}
	/* square at the baseline, rounded at the data end */
	.share-fill {
		display: block;
		height: 100%;
		border-radius: 0 2px 2px 0;
		background-color: rgba(72, 72, 72, 0.5);
	}
	.share-pct {
		flex: none;
		min-width: 4.6rem;
		text-align: right;
		font-size: 1.05rem;
		color: var(--textColor);
	}
	tfoot td {
		border-bottom: none;
	}

	/* ---------------------------------------------------------- customers --- */
	/* part-to-whole: the 2px separation is the surface showing through */
	.split {
		display: flex;
		gap: 2px;
		height: 10px;
		margin-bottom: 1.6rem;
	}
	.seg-fill {
		flex: 0 1 0;
		border-radius: 2px;
	}
	.seg-fill.fresh {
		background-color: #dcd8d4;
	}
	.seg-fill.repeat {
		background-color: rgba(72, 72, 72, 0.5);
	}
	.legend {
		display: flex;
		flex-wrap: wrap;
		gap: 0.8rem 2.4rem;
		margin-bottom: 2.4rem;
	}
	.legend li {
		display: flex;
		align-items: baseline;
		gap: 0.7rem;
		font-size: 1.15rem;
		line-height: 1.6;
		color: var(--textColor);
	}
	.sw {
		flex: none;
		width: 10px;
		height: 10px;
		border-radius: 2px;
		transform: translateY(-1px);
	}
	.sw.fresh {
		background-color: #dcd8d4;
	}
	.sw.repeat {
		background-color: rgba(72, 72, 72, 0.5);
	}
	.lg-pct {
		color: var(--blackColor);
	}
	.lg-sub {
		font-size: 1.05rem;
		font-variant-numeric: tabular-nums;
	}

	/* --------------------------------------------------------------- note --- */
	.note {
		margin-top: 3.2rem;
		padding-top: 2rem;
		border-top: 1px solid #f0eeec;
		max-width: 64rem;
		font-size: 1.05rem;
		line-height: 1.9;
		text-align: left;
		color: var(--subColor);
	}

	@media screen and (min-width: 900px) {
		.chart-card {
			padding: 2.4rem 2rem 2rem;
		}
	}
</style>
