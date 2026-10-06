<script>
	import AdminShell from '$lib/admin/AdminShell.svelte';
	import StatCard from '$lib/admin/StatCard.svelte';
	import Badge from '$lib/admin/Badge.svelte';
	import Toolbar from '$lib/admin/Toolbar.svelte';
	import Section from '$lib/admin/Section.svelte';
	import Field from '$lib/admin/Field.svelte';
	import EmptyState from '$lib/admin/EmptyState.svelte';
	import { yen } from '$lib/shop/money.js';

	export let data;
	export let form = null;

	/** id of the row whose adjustment panel is open (one at a time). */
	let openId = null;
	/** product filter for the history table, kept in step with the URL. */
	let pick = '';
	$: pick = data.productId;

	$: threshold = data.threshold;

	function toggle(id) {
		openId = openId === id ? null : id;
	}

	function stockTone(stock) {
		if (stock <= 0) return 'danger';
		return stock <= threshold ? 'warn' : 'good';
	}

	function stockLabel(stock) {
		if (stock <= 0) return '在庫切れ';
		return stock <= threshold ? '残りわずか' : '在庫あり';
	}

	function submitFilter(e) {
		e.currentTarget.form?.requestSubmit();
	}

	// Validate before the browser posts, and make the owner confirm any decrease
	// — that is the direction that loses stock they may not get back.
	function confirmAdjust(e, name) {
		const f = new FormData(e.currentTarget);
		const qty = Number(f.get('qty'));
		const sign = f.get('sign');
		const reason = String(f.get('reason') ?? '');
		const memo = String(f.get('memo') ?? '').trim();

		if (!Number.isInteger(qty) || qty < 1 || qty > data.maxQty) {
			e.preventDefault();
			alert(`数量は1〜${data.maxQty}の整数で入力してください。`);
			return;
		}
		if (reason === 'その他' && !memo) {
			e.preventDefault();
			alert('「その他」を選んだときは、補足欄に理由を入力してください。');
			return;
		}
		if (sign === 'out') {
			const ok = confirm(`${name} の在庫を −${qty} します（${reason}）。よろしいですか？`);
			if (!ok) e.preventDefault();
		}
	}
</script>

<AdminShell title="在庫" section="inventory" subtitle="いまの在庫と、そうなった理由をここで確かめられます。">
	<span slot="actions">
		<a class="a-btn" href="/shop/edit/products">商品管理へ</a>
	</span>

	{#if form?.error}
		<p class="notice bad" role="alert">{form.error}</p>
	{:else if form?.message}
		<p class="notice good" role="status">{form.message}</p>
	{/if}

	<div class="a-grid stats">
		<StatCard
			label="総在庫点数"
			value={data.stats.totalUnits.toLocaleString('ja-JP')}
			unit="点"
			sub="公開中の商品 {data.stats.publishedCount} 点の合計"
		/>
		<StatCard
			label="在庫切れ"
			value={data.stats.outOfStock}
			unit="商品"
			tone={data.stats.outOfStock > 0 ? 'danger' : 'default'}
			sub={data.stats.outOfStock > 0 ? '販売できない状態です' : '在庫切れはありません'}
		/>
		<StatCard
			label="残りわずか"
			value={data.stats.lowStock}
			unit="商品"
			tone={data.stats.lowStock > 0 ? 'warn' : 'default'}
			sub="在庫 {threshold} 点以下"
		/>
		<StatCard
			label="在庫金額"
			value={yen(data.stats.stockValue)}
			sub={data.stats.costMissing > 0
				? `原価ベース。原価未設定の商品 ${data.stats.costMissing} 点は除外しています。`
				: '原価ベース。原価未設定の商品は除外しています。'}
		/>
	</div>

	<Section title="在庫一覧" desc="在庫の少ないものから並んでいます。その場で増減でき、結果はすぐ下の履歴に残ります。">
		<Toolbar>
			<span class="a-muted">{data.rows.length} 商品</span>
			<span class="spacer"></span>
			{#if data.showAll}
				<a class="a-btn small" href={data.productId ? `?p=${data.productId}` : '?'}>公開中のみ表示</a>
			{:else}
				<a class="a-btn small" href={data.productId ? `?all=1&p=${data.productId}` : '?all=1'}>
					下書きも表示
				</a>
			{/if}
		</Toolbar>

		{#if data.rows.length === 0}
			<EmptyState
				text="表示できる商品がありません。"
				actionHref="/shop/edit/products/new"
				actionLabel="商品を追加"
			/>
		{:else}
			<div class="a-table-scroll">
				<table class="a-table stock">
					<thead>
						<tr>
							<th class="c-thumb"><span class="sr">画像</span></th>
							<th>商品名</th>
							<th class="c-sku">SKU</th>
							<th class="num">現在庫</th>
							<th>状態</th>
							<th class="c-act"><span class="sr">在庫を動かす</span></th>
						</tr>
					</thead>
					<tbody>
						{#each data.rows as p (p.id)}
							<tr class:open={openId === p.id}>
								<td class="c-thumb">
									<span class="thumb">
										{#if p.image}<img src={p.image} alt="" loading="lazy" />{/if}
									</span>
								</td>
								<td class="strong">
									<a href="/shop/edit/products/{p.id}">{p.name}</a>
									{#if p.status !== 'published'}
										<span class="a-chip draft">下書き</span>
									{/if}
								</td>
								<td class="c-sku a-muted">{p.sku || '—'}</td>
								<td class="num strong">{p.stock.toLocaleString('ja-JP')}</td>
								<td><Badge tone={stockTone(p.stock)} label={stockLabel(p.stock)} /></td>
								<td class="c-act">
									<div class="acts">
										<form method="POST" action="?/adjust" class="quick">
											<input type="hidden" name="id" value={p.id} />
											<input type="hidden" name="qty" value="1" />
											<input type="hidden" name="reason" value="手動調整" />
											<button
												class="a-btn small"
												type="submit"
												name="sign"
												value="out"
												disabled={p.stock <= 0}
												title={p.stock <= 0 ? '在庫が0のため減らせません' : '1点減らす'}
											>
												−1
											</button>
											<button class="a-btn small" type="submit" name="sign" value="in" title="1点増やす">
												+1
											</button>
										</form>
										<button
											class="a-btn small"
											type="button"
											aria-expanded={openId === p.id}
											on:click={() => toggle(p.id)}
										>
											{openId === p.id ? '閉じる' : '調整'}
										</button>
									</div>
								</td>
							</tr>

							{#if openId === p.id}
								<tr class="panel-row">
									<td colspan="6">
										<form
											method="POST"
											action="?/adjust"
											class="panel"
											on:submit={(e) => confirmAdjust(e, p.name)}
										>
											<input type="hidden" name="id" value={p.id} />
											<p class="panel-head">
												<span class="strong">{p.name}</span>
												<span class="a-muted">現在の在庫 {p.stock} 点</span>
											</p>

											<div class="panel-grid">
												<Field label="入庫 / 出庫">
													<select class="a-select" name="sign">
														<option value="in">入庫（＋ 増やす）</option>
														<option value="out">出庫（− 減らす）</option>
													</select>
												</Field>

												<Field label="数量" hint="1〜{data.maxQty}">
													<input
														class="a-input"
														type="number"
														name="qty"
														min="1"
														max={data.maxQty}
														step="1"
														value="1"
														inputmode="numeric"
														required
													/>
												</Field>

												<Field label="理由">
													<select class="a-select" name="reason">
														{#each data.reasons as r (r)}
															<option value={r}>{r}</option>
														{/each}
													</select>
												</Field>

												<div class="wide">
													<Field label="補足（任意）" hint="「その他」を選んだときは必ず入力してください。">
														<input
															class="a-input"
															type="text"
															name="memo"
															maxlength="120"
															placeholder="例）展示会サンプルとして持ち出し"
														/>
													</Field>
												</div>
											</div>

											<div class="panel-foot">
												<button class="a-btn primary" type="submit">この内容で調整する</button>
												<button class="a-btn ghost" type="button" on:click={() => (openId = null)}>
													やめる
												</button>
											</div>
										</form>
									</td>
								</tr>
							{/if}
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</Section>

	<Section
		title="入出庫の履歴"
		desc="販売による在庫の減少はご注文の確定時に自動で反映されます（1件ずつの明細はオーダー一覧でご確認ください）。この履歴には手動の調整が残ります。"
	>
		<Toolbar>
			<form method="GET" class="filter">
				{#if data.showAll}<input type="hidden" name="all" value="1" />{/if}
				<label class="fl">
					<span class="sr">商品で絞り込む</span>
					<select class="a-select narrow" name="p" bind:value={pick} on:change={submitFilter}>
						<option value="">すべての商品</option>
						{#each data.options as o (o.id)}
							<option value={o.id}>{o.name}</option>
						{/each}
					</select>
				</label>
				<button class="a-btn" type="submit">絞り込む</button>
				{#if data.productId}
					<a class="a-btn ghost" href={data.showAll ? '?all=1' : '?'}>解除</a>
				{/if}
			</form>
			<span class="spacer"></span>
			<span class="a-muted">最新 {data.movesLimit} 件まで</span>
		</Toolbar>

		{#if data.moves.length === 0}
			<EmptyState text="まだ在庫の調整履歴はありません。" />
		{:else}
			<div class="a-table-scroll">
				<table class="a-table">
					<thead>
						<tr>
							<th>日時</th>
							<th>商品名</th>
							<th class="num">増減</th>
							<th>理由</th>
							<th>実行者</th>
						</tr>
					</thead>
					<tbody>
						{#each data.moves as m (m.id)}
							<tr>
								<td class="a-muted stampcell">{m.stamp || '—'}</td>
								<td>{m.name || '（削除された商品）'}</td>
								<td class="num strong" class:minus={m.delta < 0}>
									{m.delta > 0 ? '+' : ''}{m.delta}
								</td>
								<td>{m.reason || '—'}</td>
								<td class="a-muted">{m.actor || '—'}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</Section>
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

	/* result of the last write — stated plainly, never only as a colour */
	.notice {
		margin-bottom: 2.4rem;
		padding: 1.2rem 1.6rem;
		border: 1px solid var(--a-line);
		border-radius: 3px;
		font-size: 1.15rem;
		line-height: 1.7;
		text-align: left;
	}
	.notice.good {
		border-color: var(--a-good-line);
		background-color: var(--a-good-bg);
		color: var(--a-good);
	}
	.notice.bad {
		border-color: var(--a-danger-line);
		background-color: var(--a-danger-bg);
		color: var(--a-danger);
	}

	.stats {
		margin-bottom: 4.8rem;
	}

	/* ------------------------------------------------------------ table --- */
	.c-thumb {
		width: 4.4rem;
	}
	.thumb {
		display: block;
		width: 3.6rem;
		height: 4.4rem;
		background-color: #f4f2ef;
		overflow: hidden;
	}
	.thumb img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}
	.c-sku {
		font-size: 1.05rem;
		white-space: nowrap;
	}
	.a-chip.draft {
		margin-left: 0.8rem;
	}
	.acts {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 0.6rem;
	}
	.quick {
		display: flex;
		gap: 0.4rem;
	}
	.stock tbody tr.open {
		background-color: var(--a-hover);
	}
	.stock tbody tr.open > td {
		border-bottom-color: transparent;
	}
	.minus {
		color: var(--a-danger);
	}
	.stampcell {
		white-space: nowrap;
		font-variant-numeric: tabular-nums;
	}

	/* ------------------------------------------------ adjustment panel --- */
	.panel-row > td {
		padding-top: 0;
		padding-bottom: 2rem;
		background-color: var(--a-hover);
	}
	.panel {
		display: flex;
		flex-direction: column;
		gap: 1.6rem;
		max-width: 76rem;
		padding: 1.8rem;
		border: 1px solid var(--a-line);
		border-radius: 3px;
		background-color: var(--a-surface);
	}
	.panel-head {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.4rem 1.2rem;
		font-size: 1.2rem;
		line-height: 1.5;
		text-align: left;
	}
	.panel-head .strong {
		color: var(--blackColor);
	}
	.panel-grid {
		display: grid;
		gap: 1.4rem;
		grid-template-columns: 1fr;
	}
	.panel-foot {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.8rem;
	}

	.filter {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.8rem;
	}
	.fl {
		display: block;
	}

	@media screen and (min-width: 720px) {
		.panel-grid {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
		.wide {
			grid-column: 1 / -1;
		}
	}
</style>
