<script>
	// Customer list. お客さま are derived from orders, so there is nothing to
	// create here — only to find, read and sort.
	import { goto } from '$app/navigation';
	import AdminShell from '$lib/admin/AdminShell.svelte';
	import StatCard from '$lib/admin/StatCard.svelte';
	import Badge from '$lib/admin/Badge.svelte';
	import Toolbar from '$lib/admin/Toolbar.svelte';
	import SearchInput from '$lib/admin/SearchInput.svelte';
	import Pagination from '$lib/admin/Pagination.svelte';
	import EmptyState from '$lib/admin/EmptyState.svelte';
	import { yen } from '$lib/shop/money.js';
	import { NOUN } from '$lib/shop/vocab.js';

	export let data;

	const SORTS = [
		{ key: 'recent', label: '最近の購入順' },
		{ key: 'orders', label: '購入回数順' },
		{ key: 'total', label: '利用金額順' }
	];

	// Dates are stored as UTC ISO strings; the shop is run from Japan, so every
	// date the owner reads is JST.
	const JST_DAY = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tokyo' });

	function day(iso) {
		if (!iso) return '—';
		const d = new Date(iso);
		return Number.isNaN(d.getTime()) ? '—' : JST_DAY.format(d);
	}

	function detailHref(email) {
		return '/shop/edit/customers/' + encodeURIComponent(email);
	}

	// Convenience only: the name cell holds the real link, so keyboard users and
	// a JS-less browser reach the same place without this.
	function rowTo(e, href) {
		if (e.target.closest('a, button, input, select, label')) return;
		goto(href);
	}

	$: list = data.list;
	$: summary = data.summary;
	$: pageParams = { q: data.q, sort: data.sort === 'recent' ? '' : data.sort };
</script>

<AdminShell
	title={NOUN.customers}
	section="customers"
	subtitle="ご購入いただいたお客さま（メールアドレス単位）"
>
	<div class="a-grid stats">
		<StatCard label="お客さま数" value={summary.people.toLocaleString('ja-JP')} unit="人" />
		<StatCard
			label="リピーター"
			value={summary.repeaters.toLocaleString('ja-JP')}
			unit="人"
			sub="2回以上ご購入"
		/>
		<StatCard label="リピート率" value={summary.repeatRate.toLocaleString('ja-JP')} unit="%" />
		<StatCard label="平均LTV" value={yen(summary.avgLtv)} sub="お一人あたりの通算利用金額" />
	</div>

	<Toolbar>
		<form class="filters" method="GET">
			<SearchInput value={data.q} name="q" placeholder="氏名・メールアドレスで検索" />

			<label class="pick">
				<span class="sr">並び替え</span>
				<select
					class="a-select narrow"
					name="sort"
					on:change={(e) => e.currentTarget.form.requestSubmit()}
				>
					{#each SORTS as s (s.key)}
						<option value={s.key} selected={data.sort === s.key}>{s.label}</option>
					{/each}
				</select>
			</label>

			<button class="a-btn" type="submit">検索</button>
			{#if data.q}
				<a class="a-btn ghost" href="/shop/edit/customers">条件をクリア</a>
			{/if}
		</form>

		<span class="spacer"></span>
		<span class="a-muted a-num count">{list.total.toLocaleString('ja-JP')}件</span>
	</Toolbar>

	{#if list.customers.length === 0}
		<EmptyState
			text={data.q
				? `「${data.q}」に一致するお客さまは見つかりませんでした。お名前の一部やメールアドレスでも探せます。`
				: `最初のオーダーが入ると、ここにお客さまが並びます。まずは${NOUN.item}を公開しましょう。`}
			actionHref={data.q ? '/shop/edit/customers' : '/shop/edit/products'}
			actionLabel={data.q ? '条件をクリア' : `${NOUN.items}を見る`}
		/>
	{:else}
		<div class="a-table-scroll">
			<table class="a-table">
				<thead>
					<tr>
						<th>氏名</th>
						<th>メールアドレス</th>
						<th class="num">購入回数</th>
						<th class="num">利用金額</th>
						<th>初回購入日</th>
						<th>最終購入日</th>
						<th><span class="sr">区分</span></th>
					</tr>
				</thead>
				<tbody>
					{#each list.customers as c (c.email)}
						<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_noninteractive_element_interactions -->
						<tr class="row" on:click={(e) => rowTo(e, detailHref(c.email))}>
							<td class="strong">
								<a href={detailHref(c.email)}>
									{c.name ? c.name + ' 様' : '（お名前の記録なし）'}
								</a>
							</td>
							<td class="mail"><span class="a-muted">{c.email}</span></td>
							<td class="num">{c.orders.toLocaleString('ja-JP')}</td>
							<td class="num strong">{yen(c.total)}</td>
							<td class="a-num a-muted">{day(c.first_at)}</td>
							<td class="a-num">{day(c.last_at)}</td>
							<td class="tag">
								{#if c.orders >= 2}<Badge tone="good" label="リピーター" />{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<Pagination page={list.page} pages={list.pages} params={pageParams} />
	{/if}
</AdminShell>

<style>
	.stats {
		margin-bottom: 3.2rem;
	}
	.filters {
		display: flex;
		flex: 1 1 32rem;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.8rem;
		min-width: 0;
	}
	.pick {
		display: block;
	}
	.count {
		font-size: 1.05rem;
		white-space: nowrap;
	}
	.row {
		cursor: pointer;
	}
	.mail {
		word-break: break-all;
	}
	.tag {
		white-space: nowrap;
	}
	.sr {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip: rect(0 0 0 0);
		clip-path: inset(50%);
		white-space: nowrap;
	}

	@media screen and (min-width: 900px) {
		.stats {
			margin-bottom: 4rem;
		}
	}
</style>
