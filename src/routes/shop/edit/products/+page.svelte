<script>
	import { afterNavigate } from '$app/navigation';
	import { enhance } from '$app/forms';
	import AdminShell from '$lib/admin/AdminShell.svelte';
	import Toolbar from '$lib/admin/Toolbar.svelte';
	import SearchInput from '$lib/admin/SearchInput.svelte';
	import Badge from '$lib/admin/Badge.svelte';
	import ConfirmButton from '$lib/admin/ConfirmButton.svelte';
	import Pagination from '$lib/admin/Pagination.svelte';
	import EmptyState from '$lib/admin/EmptyState.svelte';
	import { yen } from '$lib/shop/money.js';
	import { FIELD, ITEM_STATUS, NOUN, itemStatusLabel } from '$lib/shop/vocab.js';

	export let data;
	export let form = null;

	const STATUSES = [
		{ key: '', label: 'すべての状態' },
		...Object.keys(ITEM_STATUS).map((key) => ({ key, label: itemStatusLabel(key) }))
	];
	const SORTS = [
		{ key: 'new', label: '新しい順' },
		{ key: 'name', label: '名前順' },
		{ key: 'high', label: '価格が高い順' },
		{ key: 'stock', label: '在庫が少ない順' }
	];

	// Filter controls mirror the URL. They are local only so the selects can
	// submit themselves on change; the query string stays the source of truth.
	let fq = '';
	let fstatus = '';
	let fcategory = '';
	let fsort = 'new';
	$: syncFilters(data.query);

	// Stock the owner has typed but not saved yet, keyed by product id.
	let stockDraft = {};
	// A freshly loaded list always wins over unsaved keystrokes, so the table can
	// never show a number that quietly disagrees with the database.
	$: syncDrafts(data.products);

	// Rows ticked for a bulk status change. A selection always means "these rows,
	// as shown", so navigating away from them clears it.
	let selected = {};
	afterNavigate(() => {
		selected = {};
	});

	// id of the row whose stock is being saved right now
	let saving = '';

	$: rows = data.products ?? [];
	$: picked = rows.filter((p) => selected[p.id]);
	$: allPicked = rows.length > 0 && picked.length === rows.length;
	$: somePicked = picked.length > 0 && !allPicked;
	$: firstIndex = data.total === 0 ? 0 : (data.page - 1) * data.perPage + 1;
	$: lastIndex = Math.min(data.page * data.perPage, data.total);
	$: filtered = !!(data.query.q || data.query.status || data.query.category);
	$: params = {
		q: data.query.q,
		status: data.query.status,
		category: data.query.category,
		sort: data.query.sort
	};
	// The active category stays selectable even if it has just been emptied out.
	$: categories = [...new Set([...(data.categories ?? []), data.query.category].filter(Boolean))];

	function syncFilters(query) {
		fq = query.q;
		fstatus = query.status;
		fcategory = query.category;
		fsort = query.sort;
	}

	function syncDrafts(products) {
		const next = {};
		for (const p of products ?? []) next[p.id] = p.stock;
		stockDraft = next;
	}

	/** Selects apply immediately — no "apply" button to forget to press. */
	function applyFilters(event) {
		const el = event.currentTarget.form;
		if (!el) return;
		if (typeof el.requestSubmit === 'function') el.requestSubmit();
		else el.submit();
	}

	function toggle(id) {
		selected = { ...selected, [id]: !selected[id] };
	}

	function toggleAll() {
		if (allPicked) {
			selected = {};
			return;
		}
		const next = {};
		for (const p of rows) next[p.id] = true;
		selected = next;
	}

	/** Only a whole, non-negative, actually different number is savable. */
	function isDirty(draft, stock) {
		if (draft === '' || draft === null || draft === undefined) return false;
		const n = Number(draft);
		return Number.isInteger(n) && n >= 0 && n !== stock;
	}

	function stockTone(stock) {
		if (stock <= 0) return 'out';
		if (stock <= data.lowStockThreshold) return 'low';
		return '';
	}

	function saveStock({ formData }) {
		saving = String(formData.get('id') ?? '');
		// reset:false — the typed value must survive a rejected save so the owner
		// can correct it instead of retyping it.
		return async ({ update }) => {
			await update({ reset: false });
			saving = '';
		};
	}

	function applyBulk() {
		return async ({ result, update }) => {
			await update();
			if (result.type === 'success') selected = {};
		};
	}
</script>

<AdminShell
	title={NOUN.items}
	section="products"
	subtitle="公開状態と在庫をこの一覧から直接動かせます"
>
	<a slot="actions" class="a-btn primary" href="/shop/edit/products/new">＋ {NOUN.item}を作成</a>

	{#if form?.error}
		<p class="flash bad" role="status">{form.error}</p>
	{:else if form?.message}
		<p class="flash" role="status">{form.message}</p>
	{/if}

	<Toolbar>
		<!-- filters live in the URL, so this is a plain GET form -->
		<form class="filter" method="GET">
			<SearchInput bind:value={fq} name="q" placeholder="{FIELD.itemName}・slug・{FIELD.sku}" />
			<label>
				<span class="sr">状態</span>
				<select class="a-select narrow" name="status" bind:value={fstatus} on:change={applyFilters}>
					{#each STATUSES as s (s.key)}
						<option value={s.key}>{s.label}</option>
					{/each}
				</select>
			</label>
			{#if categories.length > 0}
				<label>
					<span class="sr">カテゴリ</span>
					<select
						class="a-select narrow"
						name="category"
						bind:value={fcategory}
						on:change={applyFilters}
					>
						<option value="">すべてのカテゴリ</option>
						{#each categories as c (c)}
							<option value={c}>{c}</option>
						{/each}
					</select>
				</label>
			{/if}
			<label>
				<span class="sr">並び替え</span>
				<select class="a-select narrow" name="sort" bind:value={fsort} on:change={applyFilters}>
					{#each SORTS as s (s.key)}
						<option value={s.key}>{s.label}</option>
					{/each}
				</select>
			</label>
			<button class="a-btn" type="submit">絞り込む</button>
			{#if filtered}
				<a class="a-btn ghost" href="/shop/edit/products">条件をクリア</a>
			{/if}
		</form>
	</Toolbar>

	{#if picked.length > 0}
		<div class="bulk" role="region" aria-label="一括操作">
			<span class="count"><strong>{picked.length}件</strong>を選択中</span>

			<form method="POST" action="?/bulkStatus" use:enhance={applyBulk}>
				{#each picked as p (p.id)}
					<input type="hidden" name="ids" value={p.id} />
				{/each}
				<ConfirmButton
					label="公開にする"
					name="status"
					value="published"
					message={`選択した${picked.length}件を公開にします。店頭にすぐ並びます。よろしいですか？`}
				/>
				<ConfirmButton
					label="下書きに戻す"
					name="status"
					value="draft"
					message={`選択した${picked.length}件を下書きに戻します。店頭から見えなくなります。よろしいですか？`}
				/>
			</form>

			<button class="a-btn ghost" type="button" on:click={() => (selected = {})}>選択解除</button>
		</div>
	{/if}

	{#if rows.length === 0}
		<!-- Empty states name the next step instead of just reporting emptiness,
		     and never imply the owner did something wrong. -->
		<EmptyState
			text={filtered
				? `この条件に合う${NOUN.item}は見つかりませんでした。条件を変えるとほかの${NOUN.item}が見つかります。`
				: `最初の${NOUN.item}を登録しましょう。名前・価格・在庫・画像があれば公開できます。`}
			actionHref={filtered ? '/shop/edit/products' : '/shop/edit/products/new'}
			actionLabel={filtered ? '条件をクリア' : `＋ ${NOUN.item}を作成`}
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
									checked={allPicked}
									indeterminate={somePicked}
									on:change={toggleAll}
								/>
								<span class="sr">このページの{NOUN.items}をすべて選択</span>
							</label>
						</th>
						<th class="thumb"><span class="sr">画像</span></th>
						<th>{NOUN.item}</th>
						<th>{FIELD.sku}</th>
						<th class="num">{FIELD.price}</th>
						<th class="stock">{FIELD.stock}</th>
						<th>状態</th>
						<th class="ops"><span class="sr">操作</span></th>
					</tr>
				</thead>
				<tbody>
					{#each rows as p (p.id)}
						<!-- STORES tints the whole row when stock needs attention, so a
						     problem is visible while scanning the list, not only when
						     the eye reaches the stock column. -->
						<tr
							class="row"
							class:out={stockTone(p.stock) === 'out'}
							class:low={stockTone(p.stock) === 'low'}
						>
							<td class="pick">
								<label class="cb">
									<input
										type="checkbox"
										checked={!!selected[p.id]}
										on:change={() => toggle(p.id)}
									/>
									<span class="sr">{p.name} を選択</span>
								</label>
							</td>
							<td class="thumb">
								<a class="shot" href="/shop/edit/products/{p.id}" tabindex="-1" aria-hidden="true">
									{#if p.images[0]}
										<img src={p.images[0]} alt="" loading="lazy" />
									{/if}
								</a>
							</td>
							<td class="strong">
								<a href="/shop/edit/products/{p.id}">{p.name}</a>
								{#if p.spec}<span class="spec a-muted">{p.spec}</span>{/if}
								{#if p.category}<span class="a-chip cat">{p.category}</span>{/if}
							</td>
							<td class="a-muted a-num">{p.sku || '—'}</td>
							<td class="num strong">{yen(p.price)}</td>
							<td class="stock">
								<!-- Inline edit: type the quantity you want to end up with,
								     then save. The button only wakes for a changed row. -->
								<form class="stock-form" method="POST" action="?/adjustStock" use:enhance={saveStock}>
									<input type="hidden" name="id" value={p.id} />
									<input
										class="a-input qty {stockTone(p.stock)}"
										type="number"
										name="stock"
										min="0"
										step="1"
										inputmode="numeric"
										bind:value={stockDraft[p.id]}
										max="9999"
										aria-label="{p.name} の{FIELD.stock}"
									/>
									<button
										class="a-btn small"
										type="submit"
										disabled={!isDirty(stockDraft[p.id], p.stock) || saving === p.id}
									>
										{saving === p.id ? '保存中' : '保存'}
									</button>
								</form>
								{#if isDirty(stockDraft[p.id], p.stock)}
									<span class="state unsaved">未保存</span>
								{:else if p.stock <= 0}
									<span class="state out">在庫切れ</span>
								{:else if p.stock <= data.lowStockThreshold}
									<span class="state low">残りわずか</span>
								{/if}
							</td>
							<td>
								<Badge
									tone={ITEM_STATUS[p.status]?.tone ?? 'neutral'}
									label={itemStatusLabel(p.status)}
								/>
							</td>
							<td class="ops">
								<div class="acts">
									<form method="POST" action="?/duplicate" use:enhance>
										<input type="hidden" name="id" value={p.id} />
										<ConfirmButton
											label="複製"
											message={`「${p.name}」を下書きとして複製し、複製した${NOUN.item}の編集画面を開きます。よろしいですか？`}
										/>
									</form>
									<a class="a-btn" href="/shop/edit/products/{p.id}">編集</a>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
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
	/* .sr is absolutely positioned, so its containing block has to sit inside the
	   table's scroll container. Without this the hidden labels in the rightmost
	   columns resolve against the page and drag the whole document sideways. */
	th,
	td {
		position: relative;
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

	/* ------------------------------------------------------------ filter --- */
	.filter {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.8rem 1.2rem;
		width: 100%;
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
	.bulk form {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.8rem;
	}

	/* ------------------------------------------------------------- table --- */
	.summary {
		margin-bottom: 1.2rem;
		font-size: 1.05rem;
		text-align: left;
		font-variant-numeric: tabular-nums;
	}
	th.pick,
	td.pick {
		width: 1%;
		padding-right: 0.8rem;
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

	th.thumb,
	td.thumb {
		width: 1%;
		padding-right: 1.2rem;
	}
	.shot {
		display: block;
		width: 4rem;
		height: 5rem;
		background-color: #f1efec;
		border-radius: 2px;
		overflow: hidden;
	}
	.shot img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	td .spec,
	td .cat {
		display: inline-block;
		margin-left: 0.8rem;
		font-size: 1.05rem;
		white-space: nowrap;
	}
	td .cat {
		font-size: 0.95rem;
		vertical-align: 0.1em;
	}
	td a {
		border-bottom: 1px solid #ddd9d5;
	}
	.shot {
		border-bottom: none;
	}

	/* Row tint: out of stock is a warning, low stock is a heads-up. The tint is
	   the signal that survives a quick scan; the per-cell colours below stay for
	   the exact number. */
	tr.row.out > :global(td) {
		background-color: #fdf5f3;
	}
	tr.row.low > :global(td) {
		background-color: #fdf9f2;
	}

	/* -------------------------------------------------------------- stock -- */
	th.stock,
	td.stock {
		width: 1%;
		white-space: nowrap;
	}
	.stock-form {
		display: flex;
		align-items: center;
		gap: 0.6rem;
	}
	/* out-specifies .a-input (width: 100%) from admin.css */
	.stock-form .qty {
		width: 7rem;
		text-align: right;
		font-variant-numeric: tabular-nums;
	}
	.stock-form .qty.low {
		border-color: #e8d3ae;
		background-color: #fdf9f2;
		color: #8a6224;
	}
	.stock-form .qty.out {
		border-color: #e5c8c2;
		background-color: #fdf5f3;
		color: #a3453a;
	}
	.state {
		display: block;
		margin-top: 0.5rem;
		font-size: 1rem;
		line-height: 1.4;
		letter-spacing: 0.04em;
		color: var(--subColor);
	}
	.state.low,
	.state.unsaved {
		color: #8a6224;
	}
	.state.out {
		color: #a3453a;
	}

	/* --------------------------------------------------------------- ops --- */
	th.ops,
	td.ops {
		width: 1%;
	}
	.acts {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 0.6rem;
	}
	.acts :global(.a-btn) {
		font-size: 1rem;
		padding: 0.6rem 1rem;
		border-bottom-width: 1px;
	}
	.acts a {
		border-bottom-color: var(--a-line-strong);
	}
</style>
