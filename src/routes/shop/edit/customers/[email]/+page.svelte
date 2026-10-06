<script>
	// One customer: who they are, what they bought, where it went, and the
	// owner's private memo. Nothing here leaves the shop.
	import { enhance } from '$app/forms';
	import AdminShell from '$lib/admin/AdminShell.svelte';
	import StatCard from '$lib/admin/StatCard.svelte';
	import Badge from '$lib/admin/Badge.svelte';
	import Section from '$lib/admin/Section.svelte';
	import Field from '$lib/admin/Field.svelte';
	import EmptyState from '$lib/admin/EmptyState.svelte';
	import { yen } from '$lib/shop/money.js';
	import { NOUN, orderStatusLabel, orderStatusTone } from '$lib/shop/vocab.js';

	export let data;
	export let form;

	// Shown as a derived badge, so an identical hand-typed tag is not repeated.
	const REPEATER = 'リピーター';

	// Stored timestamps are UTC ISO strings; the shop is run from Japan.
	const JST_DAY = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tokyo' });

	let saving = false;

	function day(iso) {
		if (!iso) return '—';
		const d = new Date(iso);
		return Number.isNaN(d.getTime()) ? '—' : JST_DAY.format(d);
	}

	function itemCount(items) {
		return (items ?? []).reduce((n, i) => n + (Number(i.qty) || 0), 0);
	}

	function fmtAddress(a) {
		if (!a) return '';
		const zip = a.zip ? `〒${a.zip}` : '';
		const rest = `${a.state ?? ''}${a.city ?? ''}${a.line1 ?? ''}${a.line2 ? ' ' + a.line2 : ''}`;
		return [zip, rest].filter(Boolean).join(' ').trim();
	}

	function statusOf(s) {
		return { label: orderStatusLabel(s ?? '—'), tone: orderStatusTone(s) };
	}

	function saveNote() {
		saving = true;
		return async ({ update }) => {
			// keep = false would wipe what the owner just typed on a failed save
			await update({ reset: false });
			saving = false;
		};
	}

	$: c = data.customer;
	$: isRepeater = c.stats.count >= 2;
	$: title = c.name ? `${c.name} 様` : c.email;
	$: tagsValue = (c.tags ?? []).join(', ');
	$: shownTags = (c.tags ?? []).filter((t) => !(isRepeater && t === REPEATER));
	$: statusMsg = saving
		? '保存中…'
		: form?.error
			? form.error
			: form?.ok
				? '保存しました'
				: '';
</script>

<AdminShell {title} section="customers" subtitle={c.email}>
	<span class="acts" slot="actions">
		<a class="a-btn" href="mailto:{c.email}">メールを送る</a>
		<a class="a-btn ghost" href="/shop/edit/customers">← {NOUN.customers}一覧</a>
	</span>

	<div class="ident">
		<dl class="meta">
			<div><dt>ご登録名</dt><dd>{c.name || '（記録なし）'}</dd></div>
			<div><dt>メールアドレス</dt><dd class="mail">{c.email}</dd></div>
			<div><dt>お電話番号</dt><dd>{c.phone || '—'}</dd></div>
		</dl>
		<div class="marks">
			{#if isRepeater}<Badge tone="good" label={REPEATER} />{/if}
			{#each shownTags as t (t)}<span class="a-chip">{t}</span>{/each}
		</div>
	</div>

	<div class="a-grid stats">
		<StatCard
			label="購入回数（通算）"
			value={c.stats.count.toLocaleString('ja-JP')}
			unit="回"
			sub="キャンセル分を除いた回数"
		/>
		<StatCard label="利用金額（通算）" value={yen(c.stats.total)} sub="返金分を差し引いた金額" />
		<StatCard label="初回購入日" value={day(c.stats.first_at)} />
		<StatCard label="最終購入日" value={day(c.stats.last_at)} sub="平均単価 {yen(c.stats.avg)}" />
	</div>

	<Section
		title="{NOUN.order}履歴"
		desc="キャンセル・返金分も記録として残しています（集計からは除いています）。"
	>
		<div class="a-table-scroll">
			<table class="a-table">
				<thead>
					<tr>
						<th>{NOUN.order}番号</th>
						<th>ご購入日</th>
						<th class="num">点数</th>
						<th class="num">金額</th>
						<th>状態</th>
					</tr>
				</thead>
				<tbody>
					{#each c.orders as o (o.id)}
						<tr>
							<td class="strong">
								<a href="/shop/edit/orders/{o.id}">{o.order_no}</a>
							</td>
							<td class="a-num">{day(o.created_at)}</td>
							<td class="num">{itemCount(o.items).toLocaleString('ja-JP')}</td>
							<td class="num strong">
								{yen(o.total)}
								{#if o.refunded_amount > 0}
									<span class="a-muted refund">返金 {yen(o.refunded_amount)}</span>
								{/if}
							</td>
							<td><Badge tone={statusOf(o.status).tone} label={statusOf(o.status).label} /></td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</Section>

	<Section title="お届け先" desc="これまでにご利用いただいた住所です（新しい順）。">
		{#if (c.addresses ?? []).length === 0}
			<EmptyState text="お届け先の記録はまだありません。オーダーが入ると自動で記録されます。" />
		{:else}
			<ul class="addrs">
				{#each c.addresses as a, i (i)}
					<li class="a-card addr">
						<p class="addr-name">{a.name ? a.name + ' 様' : '（お名前の記録なし）'}</p>
						<p class="addr-line">{fmtAddress(a.address) || '（住所の記録なし）'}</p>
						{#if a.phone}<p class="a-muted addr-sub">{a.phone}</p>{/if}
						<p class="a-muted addr-sub">最終利用 {day(a.last_at)}</p>
					</li>
				{/each}
			</ul>
		{/if}
	</Section>

	<Section title="{NOUN.customer}メモ" desc="この内容はお客さまには表示されません。ご自身の申し送り用です。">
		<form class="memo" method="POST" action="?/note" use:enhance={saveNote}>
			<Field label="メモ" hint="次回のご案内や、香りの好みなど。">
				<textarea class="a-textarea" name="note" rows="5" value={c.note ?? ''}></textarea>
			</Field>

			<Field
				label="管理用タグ"
				hint="購入者には表示されません。カンマ区切りで入力します。例）常連, 要フォロー, ギフト利用"
			>
				<input class="a-input" type="text" name="tags" value={tagsValue} placeholder="常連, 要フォロー" />
			</Field>

			<div class="memo-foot">
				<button class="a-btn primary" type="submit" disabled={saving}>
					{saving ? '保存中…' : 'メモを保存'}
				</button>
				{#if statusMsg}
					<span class="status" class:err={!!form?.error} role="status">{statusMsg}</span>
				{/if}
			</div>
		</form>
	</Section>
</AdminShell>

<style>
	.acts {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.8rem;
	}
	.ident {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1.6rem 2.4rem;
		padding-bottom: 2.4rem;
		margin-bottom: 3.2rem;
		border-bottom: 1px solid #f0eeec;
	}
	.meta {
		display: flex;
		flex-wrap: wrap;
		gap: 1.2rem 3.2rem;
	}
	dt {
		font-size: 1.05rem;
		line-height: 1.4;
		letter-spacing: 0.04em;
		color: var(--subColor);
	}
	dd {
		margin-top: 0.4rem;
		font-size: 1.25rem;
		line-height: 1.6;
		color: var(--blackColor);
	}
	.marks {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.6rem;
	}
	.stats {
		margin-bottom: 4rem;
	}
	dd.mail {
		font-size: 1.15rem;
		word-break: break-all;
	}
	.refund {
		display: block;
		font-size: 1rem;
		line-height: 1.5;
	}

	.addrs {
		display: grid;
		gap: 1.2rem;
		grid-template-columns: repeat(auto-fit, minmax(26rem, 1fr));
	}
	.addr-name {
		font-size: 1.2rem;
		line-height: 1.6;
		text-align: left;
		color: var(--blackColor);
	}
	.addr-line {
		margin-top: 0.6rem;
		font-size: 1.15rem;
		line-height: 1.8;
		text-align: left;
	}
	.addr-sub {
		margin-top: 0.4rem;
		font-size: 1.05rem;
		line-height: 1.6;
		text-align: left;
	}

	.memo {
		display: flex;
		flex-direction: column;
		gap: 2rem;
		max-width: 64rem;
	}
	.memo-foot {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 1.2rem;
	}
	.status {
		font-size: 1.1rem;
		line-height: 1.6;
		color: #4d6b57;
	}
	.status.err {
		color: #a3453a;
	}

	@media screen and (min-width: 900px) {
		.ident {
			margin-bottom: 4rem;
		}
	}
</style>
