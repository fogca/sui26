<script>
	import { goto, afterNavigate } from '$app/navigation';
	import { enhance } from '$app/forms';
	import AdminShell from '$lib/admin/AdminShell.svelte';
	import Toolbar from '$lib/admin/Toolbar.svelte';
	import SearchInput from '$lib/admin/SearchInput.svelte';
	import Badge from '$lib/admin/Badge.svelte';
	import Pagination from '$lib/admin/Pagination.svelte';
	import EmptyState from '$lib/admin/EmptyState.svelte';
	import { yen } from '$lib/shop/money.js';
	import {
		ORDER_TABS,
		NOUN,
		orderStatusLabel,
		orderStatusTone,
		DEFAULT_ORDER_MONTHS
	} from '$lib/shop/vocab.js';

	export let data;
	export let form = null;

	const SORTS = [
		{ key: 'new', label: '新しい順' },
		{ key: 'old', label: '古い順' },
		{ key: 'high', label: '金額が高い順' },
		{ key: 'low', label: '金額が安い順' }
	];
	const PAYMENT = {
		card: 'カード',
		applepay: 'Apple Pay',
		googlepay: 'Google Pay',
		paypay: 'PayPay',
		konbini: 'コンビニ',
		mock: 'テスト決済'
	};

	// An order still unshipped after this many days gets a warning marker.
	const OVERDUE_DAYS = 3;

	// Dates are stored as UTC but the shop is run from Japan, so every timestamp
	// on this screen is rendered in JST.
	const jstStamp = new Intl.DateTimeFormat('sv-SE', {
		timeZone: 'Asia/Tokyo',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit'
	});

	let selected = {};
	// A selection always means "these rows, as shown". Navigating (paging,
	// filtering) clears it so a bulk action can never touch rows out of sight.
	afterNavigate(() => {
		selected = {};
	});

	$: query = data.query;
	$: limit = data.bulkLimit ?? 50;
	$: params = {
		status: query.status,
		q: query.q,
		from: query.from,
		to: query.to,
		sort: query.sort,
		all: query.all
	};
	$: rows = data.orders ?? [];
	$: counts = data.counts ?? {};
	$: byId = new Map(rows.map((o) => [o.id, o]));
	$: pickedIds = Object.keys(selected).filter((id) => selected[id]);
	// Rows picked beyond this page (via "select all results") are known by id
	// only; they still count and can still be shipped.
	$: picked = pickedIds;
	// Only 'paid' orders can move to shipped; the rest are shown as out of scope
	// instead of being silently swept along. Ids not on this page are assumed
	// shippable — the action itself only touches rows that are still 'paid'.
	$: shippable = pickedIds.filter((id) => (byId.has(id) ? byId.get(id).status === 'paid' : true));
	$: pagePicked = rows.filter((o) => selected[o.id]).length;
	$: allPagePicked = rows.length > 0 && pagePicked === rows.length;
	$: somePagePicked = pagePicked > 0 && !allPagePicked;
	$: firstIndex = data.total === 0 ? 0 : (data.page - 1) * data.perPage + 1;
	$: lastIndex = Math.min(data.page * data.perPage, data.total);
	$: b2Href = '/shop/api/admin/b2?format=b2&ids=' + pickedIds.join(',');
	$: filtered = !!(query.q || query.from || query.to);
	// How many rows "絞り込み結果すべてを選択" would take, and whether it truncates.
	$: matchIds = data.matchIds ?? [];
	$: overLimit = data.total > limit;

	function tabHref(key) {
		const p = new URLSearchParams();
		p.set('status', key);
		if (query.q) p.set('q', query.q);
		if (query.from) p.set('from', query.from);
		if (query.to) p.set('to', query.to);
		if (query.sort !== 'new') p.set('sort', query.sort);
		if (query.all) p.set('all', '1');
		return '?' + p.toString();
	}

	function clearHref() {
		// keep the tab, drop search/date; ?all=1 survives so a reset stays reset
		return `?status=${query.status}` + (query.all ? '&all=1' : '');
	}

	function toggle(id) {
		selected = { ...selected, [id]: !selected[id] };
	}

	function selectPage() {
		if (allPagePicked) {
			selected = {};
			return;
		}
		const next = {};
		for (const o of rows) next[o.id] = true;
		selected = next;
	}

	function selectAllResults() {
		if (data.total > limit) {
			alert(
				`一度に操作できるのは${limit}件までです。絞り込み結果${data.total}件のうち、先頭${limit}件を選択します。`
			);
		}
		const next = {};
		for (const id of matchIds) next[id] = true;
		selected = next;
	}

	function openOrder(e, id) {
		// the checkbox cell and the order-number link handle their own clicks
		const el = e.target;
		if (el && el.closest && el.closest('a, input, label, button')) return;
		goto(`/shop/edit/orders/${id}`);
	}

	function when(iso) {
		const t = Date.parse(iso ?? '');
		if (!Number.isFinite(t)) return { date: '—', time: '' };
		const [date, time] = jstStamp.format(new Date(t)).split(' ');
		return { date, time };
	}

	function elapsedDays(iso) {
		const t = Date.parse(iso ?? '');
		if (!Number.isFinite(t)) return 0;
		return Math.floor((Date.now() - t) / 86400000);
	}

	function isOverdue(o) {
		return o.status === 'paid' && elapsedDays(o.created_at) >= OVERDUE_DAYS;
	}

	function itemCount(o) {
		return (o.items ?? []).reduce((n, i) => n + (Number(i.qty) || 0), 0);
	}

	function pref(o) {
		return o.address?.state || '—';
	}
</script>

<AdminShell title={NOUN.orders} section="orders">
	<a slot="actions" class="a-btn" href="/shop/api/admin/b2?format=b2" download
		>B2用CSV（未発送分）</a
	>

	{#if form?.error}
		<p class="flash bad" role="status">{form.error}</p>
	{:else if form?.shipped > 0}
		<p class="flash" role="status">
			{form.shipped}件を完了にしました。
			{#if form.shipped < form.requested}
				<span class="a-muted">（{form.requested - form.shipped}件は既に完了などのため対象外）</span>
			{/if}
		</p>
	{:else if form?.shipped === 0}
		<p class="flash bad" role="status">完了にできるオーダーがありませんでした。</p>
	{/if}

	<nav class="tabs" aria-label="ステータス">
		{#each ORDER_TABS as t (t.key)}
			<a
				href={tabHref(t.key)}
				class:on={query.status === t.key}
				aria-current={query.status === t.key ? 'page' : undefined}
				>{t.label}<span class="tab-count">{counts[t.key] ?? 0}</span></a
			>
		{/each}
	</nav>

	<Toolbar>
		<!-- filters live in the URL, so this is a plain GET form -->
		<form class="filter" method="GET">
			<input type="hidden" name="status" value={query.status} />
			{#if query.all}<input type="hidden" name="all" value="1" />{/if}
			<SearchInput value={query.q} name="q" placeholder="オーダー番号・お名前・メール・電話" />
			<span class="dates">
				<label>
					<span class="sr">開始日</span>
					<input class="a-input narrow" type="date" name="from" value={query.from} />
				</label>
				<span class="tilde" aria-hidden="true">〜</span>
				<label>
					<span class="sr">終了日</span>
					<input class="a-input narrow" type="date" name="to" value={query.to} />
				</label>
			</span>
			<label>
				<span class="sr">並び替え</span>
				<select
					class="a-select narrow"
					name="sort"
					on:change={(e) => e.currentTarget.form.requestSubmit()}
				>
					{#each SORTS as s (s.key)}
						<option value={s.key} selected={query.sort === s.key}>{s.label}</option>
					{/each}
				</select>
			</label>
			<button class="a-btn" type="submit">絞り込む</button>
			{#if filtered}
				<a class="a-btn ghost" href={clearHref()}>条件をクリア</a>
			{/if}
		</form>
	</Toolbar>

	{#if data.autoRange}
		<!-- the default range is applied for the owner, so it has to be visible -->
		<p class="range" role="status">
			<span>直近{DEFAULT_ORDER_MONTHS}ヶ月（{data.autoFrom} 以降）のオーダーを表示中</span>
			<a class="a-btn ghost small" href={tabHref(query.status) + '&all=1'}>リセット</a>
		</p>
	{:else if query.all && !filtered}
		<p class="range a-muted" role="status">
			<span>全期間のオーダーを表示中</span>
			<a class="a-btn ghost small" href={tabHref(query.status)}
				>直近{DEFAULT_ORDER_MONTHS}ヶ月に戻す</a
			>
		</p>
	{/if}

	{#if picked.length > 0}
		<div class="bulk" role="region" aria-label="一括操作">
			<span class="count"><strong>{picked.length}件</strong>を選択中</span>

			<form
				method="POST"
				action="?/bulkShip"
				use:enhance={({ cancel }) => {
					if (!confirm(`選択した${shippable.length}件を完了にします。よろしいですか？`)) {
						cancel();
						return;
					}
					return async ({ result, update }) => {
						await update();
						if (result.type === 'success') selected = {};
					};
				}}
			>
				{#each shippable as id (id)}
					<input type="hidden" name="ids" value={id} />
				{/each}
				<button class="a-btn primary" type="submit" disabled={shippable.length === 0}>
					選択した{shippable.length}件を完了にする
				</button>
			</form>

			<a class="a-btn" href={b2Href} download>選択分のB2 CSVを出力</a>
			<button class="a-btn ghost" type="button" on:click={() => (selected = {})}>選択解除</button>

			{#if shippable.length < picked.length}
				<span class="note a-muted"
					>未発送以外の{picked.length - shippable.length}件は発送処理の対象外です。</span
				>
			{/if}
		</div>
	{/if}

	{#if rows.length === 0}
		<EmptyState
			text={filtered
				? '検索条件に一致するオーダーはありませんでした。'
				: query.status === 'all'
					? 'まだオーダーがありません。'
					: `「${ORDER_TABS.find((t) => t.key === query.status)?.label}」のオーダーはありません。`}
			actionHref={filtered ? clearHref() : ''}
			actionLabel={filtered ? '条件をクリア' : ''}
		/>
	{:else}
		<p class="summary a-muted">
			{data.total}件中 {firstIndex}-{lastIndex}件を表示
		</p>

		<div class="a-table-scroll">
			<table class="a-table">
				<thead>
					<tr>
						<th class="pick">
							<label class="cb">
								<input
									type="checkbox"
									checked={allPagePicked}
									indeterminate={somePagePicked}
									on:change={selectPage}
								/>
								<span class="sr">このページのオーダーをすべて選択</span>
							</label>
						</th>
						<th>オーダー番号</th>
						<th>オーダー日時</th>
						<th>お名前</th>
						<th>都道府県</th>
						<th class="num">点数</th>
						<th class="num">合計金額</th>
						<th>お支払い方法</th>
						<th>ステータス</th>
						<th>ギフト</th>
					</tr>
				</thead>
				<tbody>
					{#each rows as o (o.id)}
						<!-- The row is a shortcut; the order-number link is the real,
						     keyboard-reachable path to the detail screen. -->
						<tr class:overdue={isOverdue(o)} on:click={(e) => openOrder(e, o.id)}>
							<td class="pick">
								<label class="cb">
									<input
										type="checkbox"
										checked={!!selected[o.id]}
										on:change={() => toggle(o.id)}
									/>
									<span class="sr">{o.order_no} を選択</span>
								</label>
							</td>
							<td class="strong">
								<a href="/shop/edit/orders/{o.id}">{o.order_no}</a>
							</td>
							<td>
								<span class="a-num">{when(o.created_at).date}</span>
								<span class="a-muted a-num">{when(o.created_at).time}</span>
								{#if isOverdue(o)}
									<span class="late">{elapsedDays(o.created_at)}日経過</span>
								{/if}
							</td>
							<td>{o.name || '—'}</td>
							<td class="a-muted">{pref(o)}</td>
							<td class="num">{itemCount(o)}</td>
							<td class="num strong">{yen(o.total)}</td>
							<td class="a-muted">{PAYMENT[o.payment_method] ?? o.payment_method ?? '—'}</td>
							<td>
								<Badge tone={orderStatusTone(o.status)} label={orderStatusLabel(o.status)} />
								{#if o.status === 'refunded' && o.refunded_amount}
									<span class="a-muted refund">{yen(o.refunded_amount)}</span>
								{/if}
							</td>
							<td>
								{#if o.gift}<span class="a-chip">ギフト</span>{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<!-- "this page" and "everything that matched" are different intents, so
		     they are two separate controls rather than one ambiguous checkbox. -->
		<div class="select-scope">
			<button class="a-btn ghost small" type="button" on:click={selectPage}>
				{allPagePicked ? 'このページの選択を解除' : `このページの${rows.length}件を選択`}
			</button>
			{#if data.total > rows.length}
				<button class="a-btn ghost small" type="button" on:click={selectAllResults}>
					絞り込み結果すべて（{data.total}件）を選択
				</button>
				{#if overLimit}
					<span class="a-muted note">一度に操作できるのは{limit}件までです。</span>
				{/if}
			{/if}
		</div>

		<Pagination page={data.page} pages={data.pages} {params} />
	{/if}
</AdminShell>

<style>
	.sr {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip: rect(0 0 0 0);
		clip-path: inset(50%);
		white-space: nowrap;
	}

	/* ------------------------------------------------------------- flash --- */
	.flash {
		margin-bottom: 2rem;
		padding: 1.1rem 1.4rem;
		border: 1px solid #d5e0d7;
		border-radius: 3px;
		background-color: #f7faf7;
		color: #4d6b57;
		font-size: 1.15rem;
		line-height: 1.7;
		text-align: left;
	}
	.flash.bad {
		border-color: #e8d3ae;
		background-color: #fdf9f2;
		color: #8a6224;
	}

	/* -------------------------------------------------------------- tabs --- */
	.tabs {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem 2rem;
		margin-bottom: 2rem;
	}
	.tabs a {
		font-size: 1.15rem;
		letter-spacing: 0.02em;
		color: var(--subColor);
		padding-bottom: 0.5rem;
		border-bottom: 1px solid transparent;
		transition: color 0.18s ease;
	}
	.tabs a:hover {
		opacity: 1;
		color: var(--blackColor);
	}
	.tabs a.on {
		color: var(--blackColor);
		border-bottom-color: var(--blackColor);
	}
	.tab-count {
		margin-left: 0.5rem;
		font-size: 1rem;
		color: var(--subColor);
		font-variant-numeric: tabular-nums;
	}

	/* ------------------------------------------------------------ filter --- */
	.filter {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.8rem 1.2rem;
		width: 100%;
	}
	.dates {
		display: flex;
		align-items: center;
		gap: 0.6rem;
	}
	.dates .a-input {
		min-width: 14rem;
	}
	.tilde {
		color: var(--subColor);
		font-size: 1.1rem;
	}

	/* ------------------------------------------------------------- range --- */
	.range {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.8rem 1.2rem;
		margin-bottom: 2rem;
		font-size: 1.1rem;
		line-height: 1.7;
		text-align: left;
		color: var(--textColor);
	}

	/* -------------------------------------------------------------- bulk --- */
	.bulk {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.8rem 1.2rem;
		margin-bottom: 2rem;
		padding: 1.2rem 1.4rem;
		border: 1px solid #e8e5e2;
		border-radius: 3px;
		background-color: #f7f6f4;
	}
	.bulk .count {
		font-size: 1.15rem;
		color: var(--textColor);
	}
	.bulk .count strong {
		color: var(--blackColor);
		font-variant-numeric: tabular-nums;
	}
	.note {
		flex-basis: 100%;
		font-size: 1.05rem;
		line-height: 1.6;
	}

	/* ------------------------------------------------------- select scope --- */
	.select-scope {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.8rem 1.2rem;
		margin-top: 1.4rem;
	}

	/* ------------------------------------------------------------- table --- */
	.summary {
		margin-bottom: 1.2rem;
		font-size: 1.05rem;
		text-align: left;
		font-variant-numeric: tabular-nums;
	}
	tbody tr {
		cursor: pointer;
	}
	/* the marker rail is always present so no row shifts when one turns late */
	th.pick,
	td.pick {
		width: 1%;
		padding-left: 0.9rem;
		border-left: 2px solid transparent;
	}
	tr.overdue td.pick {
		border-left-color: #d8a94a;
	}
	.cb {
		display: inline-flex;
		align-items: center;
		cursor: pointer;
	}
	.cb input {
		width: 1.6rem;
		height: 1.6rem;
		accent-color: var(--blackColor);
		cursor: pointer;
	}
	td .late {
		display: inline-block;
		margin-left: 0.6rem;
		font-size: 1rem;
		color: #8a6224;
		white-space: nowrap;
	}
	td .refund {
		margin-left: 0.6rem;
		font-size: 1.05rem;
		white-space: nowrap;
	}
	td .a-num + .a-num {
		margin-left: 0.6rem;
	}
	td a {
		border-bottom: 1px solid #ddd9d5;
	}
</style>
