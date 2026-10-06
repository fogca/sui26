<script>
	// One order, end to end: what was bought, where it goes, what state it is
	// in, and every lever the shop owner might need — without leaving the page.
	import { enhance } from '$app/forms';
	import AdminShell from '$lib/admin/AdminShell.svelte';
	import Badge from '$lib/admin/Badge.svelte';
	import Field from '$lib/admin/Field.svelte';
	import ConfirmButton from '$lib/admin/ConfirmButton.svelte';
	import { yen } from '$lib/shop/money.js';
	import { TIME_SLOTS } from '$lib/shop/stripe.js';
	import { orderStatusLabel, orderStatusTone, ORDER_STATUS } from '$lib/shop/vocab.js';

	export let data;
	export let form;

	// The table still writes the legacy 'pending' for an unpaid order; vocab
	// calls the same thing pending_payment. Normalise here, not in vocab.
	function statusKey(k) {
		return k === 'pending' ? 'pending_payment' : k;
	}

	const PROVIDER = { stripe: 'Stripe', mock: 'テスト決済（mock）' };
	const PAYMENT = {
		card: 'クレジットカード',
		konbini: 'コンビニ決済',
		paypay: 'PayPay',
		customer_balance: '銀行振込'
	};

	const ACTION_LABEL = {
		'order.paid': 'ご注文（決済完了）',
		'order.ship': '発送を完了した',
		'order.bulk_ship': '一括で完了にした',
		'order.ship_prep': '発送準備を保存した',
		'order.ship_info': '配送情報を記録した',
		'order.notify_skipped': '発送完了メール（未送信）',
		'order.tracking': '追跡番号を更新した',
		'order.cancel': 'キャンセルした',
		'order.refund': '返金を記録した',
		'order.note': 'メモを更新した',
		'order.shipping_edit': 'お届け先を修正した'
	};

	// JST everywhere — the shop is operated from Japan and created_at is UTC.
	const dtf = new Intl.DateTimeFormat('sv-SE', {
		timeZone: 'Asia/Tokyo',
		dateStyle: 'short',
		timeStyle: 'short'
	});
	function at(iso) {
		if (!iso) return '—';
		const d = new Date(iso);
		return Number.isNaN(d.getTime()) ? '—' : dtf.format(d);
	}

	$: order = data.order;
	$: addr = order.address ?? {};
	$: items = order.items ?? [];
	$: statusLabel = orderStatusLabel(statusKey(order.status));
	$: statusTone = orderStatusTone(statusKey(order.status));
	$: statusHelp = ORDER_STATUS[statusKey(order.status)]?.help ?? '';
	$: refunded = Number(order.refunded_amount ?? 0);
	$: refundable = Math.max(0, Number(order.total ?? 0) - refunded);

	$: cancelEvent = data.events.find((e) => e.action === 'order.cancel');
	$: refundEvents = data.events.filter((e) => e.action === 'order.refund');
	$: lastRefund = refundEvents.length ? refundEvents[refundEvents.length - 1] : null;

	// B2 refuses a shipment without these — say so before the CSV is generated.
	$: missing = [
		order.name ? '' : '氏名',
		order.phone ? '' : '電話番号',
		addr.zip ? '' : '郵便番号',
		addr.state || addr.city || addr.line1 ? '' : '住所'
	].filter(Boolean);

	$: slotOptions = buildSlots(order.delivery_note);
	function buildSlots(dn) {
		const list = TIME_SLOTS.slice();
		if (!dn) list.unshift({ value: '', label: '（未設定）' });
		else if (!list.some((t) => t.value === dn)) list.push({ value: dn, label: dn });
		return list;
	}
	$: addressText = [
		addr.zip ? `〒${addr.zip}` : '',
		`${addr.state ?? ''}${addr.city ?? ''}${addr.line1 ?? ''}`.trim(),
		addr.line2 ?? '',
		order.name ? `${order.name} 様` : '',
		order.phone ?? ''
	]
		.filter(Boolean)
		.join('\n');

	// Yamato is the only carrier with a tracking page we can deep-link to.
	$: trackingUrl =
		order.tracking_no && (data.settings.shipping_carrier ?? '').includes('ヤマト')
			? `https://toi.kuronekoyamato.co.jp/cgi-bin/tneko?number01=${encodeURIComponent(order.tracking_no)}`
			: '';

	let copied = false;
	let copyTimer;
	async function copyAddress() {
		try {
			if (navigator.clipboard && navigator.clipboard.writeText) {
				await navigator.clipboard.writeText(addressText);
			} else {
				// http / older WebKit: no async clipboard available
				const ta = document.createElement('textarea');
				ta.value = addressText;
				ta.setAttribute('readonly', '');
				ta.style.position = 'fixed';
				ta.style.opacity = '0';
				document.body.appendChild(ta);
				ta.select();
				document.execCommand('copy');
				document.body.removeChild(ta);
			}
			copied = true;
			clearTimeout(copyTimer);
			copyTimer = setTimeout(() => (copied = false), 2400);
		} catch (e) {
			alert('コピーできませんでした。テキストを選択してコピーしてください。');
		}
	}

	let showRefund = false;
	$: if (form && form.saved === 'refund') showRefund = false;

	/* ---------------------------------------------- shipping prep (STORES) ---
	 * Three steps on one screen: confirm what to pack, optionally record the
	 * delivery details, then finish. Leaving the mode never changes status. */
	let prepMode = false;
	let prepForm;
	let checked = {};
	let prepWarned = false;

	let tracking = '';
	let carrier = '';
	let message = '';
	let notify = true;
	let carrierGuess = '';
	let carrierTouched = false;
	let loaded = false;

	// Prefill once per loaded order, not on every reactive pass.
	$: if (!loaded && order) {
		tracking = order.tracking_no ?? '';
		carrier = data.shipPrep?.carrier || data.settings.shipping_carrier || '';
		message = data.shipPrep?.message ?? '';
		loaded = true;
	}
	$: if (form && (form.saved === 'ship' || form.saved === 'prep')) prepMode = false;

	function slotLabel(v) {
		if (!v) return '';
		const hit = TIME_SLOTS.find((t) => t.value === v);
		return hit ? hit.label : v;
	}

	// Everything the owner physically has to get right, one line each.
	$: checkRows = buildChecks(items, order, addr);
	function buildChecks(list, o, a) {
		const rows = list.map((it, i) => ({
			key: 'item-' + (it.product_id ?? i),
			kind: 'アイテム',
			text: `${it.name} × ${it.qty}`
		}));
		if (o.gift) rows.push({ key: 'gift', kind: 'オプション', text: 'ギフト包装をする' });
		const slot = slotLabel(o.delivery_note);
		if (slot) rows.push({ key: 'slot', kind: 'オプション', text: `配達時間帯: ${slot}` });
		rows.push({
			key: 'addr',
			kind: 'お届け先',
			text:
				`${a.zip ? '〒' + a.zip + ' ' : ''}${a.state ?? ''}${a.city ?? ''}${a.line1 ?? ''}` +
				`${a.line2 ? ' ' + a.line2 : ''}／${o.name || '（氏名未登録）'}`
		});
		return rows;
	}
	$: allChecked = checkRows.every((r) => checked[r.key]);
	$: uncheckedCount = checkRows.filter((r) => !checked[r.key]).length;

	function openPrep() {
		checked = {};
		prepWarned = false;
		prepMode = true;
	}

	/** Guess the carrier from the tracking number's shape.
	 *  Yamato: 12 straight digits. Sagawa: 10-12 digits in hyphenated groups. */
	function guessCarrier(v) {
		const raw = String(v ?? '').trim();
		if (!raw) return '';
		const digits = raw.replace(/\D/g, '');
		if (/^\d{12}$/.test(raw)) return 'ヤマト運輸';
		if (raw.includes('-') && digits.length >= 10 && digits.length <= 12) return '佐川急便';
		return '';
	}

	function onTracking(e) {
		tracking = e.currentTarget.value;
		const guess = guessCarrier(tracking);
		carrierGuess = guess;
		// Never overwrite a carrier the owner chose by hand.
		if (guess && !carrierTouched) carrier = guess;
	}

	const CARRIERS = ['ヤマト運輸', '佐川急便', '日本郵便', '西濃運輸', 'その他'];
	$: carrierOptions = CARRIERS.includes(carrier) || !carrier ? CARRIERS : [...CARRIERS, carrier];

	function submitShip() {
		if (!allChecked) {
			prepWarned = true;
			const ok = confirm(
				`確認できていない項目が${uncheckedCount}件あります。\nこのまま発送完了にしますか？`
			);
			if (!ok) return;
		}
		prepForm.requestSubmit();
	}
</script>

<AdminShell
	title="オーダー {order.order_no}"
	section="orders"
	subtitle="{at(order.created_at)} のご注文"
>
	<div slot="actions" class="head-acts">
		{#if order.status === 'paid' && !prepMode}
			<button class="a-btn primary" type="button" on:click={openPrep}>発送準備へ</button>
		{/if}
		<a class="a-btn" href="/shop/edit/orders">一覧へ戻る</a>
		<a class="a-btn" href="/shop/edit/orders/{order.id}/print" target="_blank" rel="noopener">
			納品書を印刷
		</a>
	</div>

	{#if form && form.error}
		<p class="banner danger" role="alert">{form.error}</p>
	{:else if form && form.saved}
		<p class="banner good" role="status">
			{#if form.saved === 'ship'}発送を完了しました。ステータスは「完了」です。
			{:else if form.saved === 'prep'}発送準備の入力内容を保存しました。ステータスは変えていません。
			{:else if form.saved === 'tracking'}追跡番号を更新しました。
			{:else if form.saved === 'cancel'}このオーダーをキャンセルしました。
			{:else if form.saved === 'refund'}返金 {yen(form.amount)} を記録しました。
			{:else if form.saved === 'shipping'}お届け先を保存しました。
			{:else if form.saved === 'note'}メモを保存しました。
			{:else}保存しました。{/if}
		</p>
	{/if}

	<div class="cols">
		<!-- ======================================================== main --- -->
		<div class="main">
			<div class="a-card summary">
				<div class="sum-top">
					<p class="ono serif">{order.order_no}</p>
					<Badge tone={statusTone} label={statusLabel} />
					{#if order.gift}<span class="a-chip">ギフト包装</span>{/if}
				</div>
				<dl class="meta">
					<div><dt>注文日時</dt><dd>{at(order.created_at)}</dd></div>
					<div>
						<dt>支払方法</dt>
						<dd>
							{PAYMENT[order.payment_method] ?? order.payment_method ?? ''}
							{#if !order.payment_method}{PROVIDER[order.provider] ?? order.provider ?? '—'}{/if}
						</dd>
					</div>
					<div><dt>合計</dt><dd class="strong">{yen(order.total)}</dd></div>
					{#if refunded > 0}
						<div><dt>返金済み</dt><dd class="neg">− {yen(refunded)}</dd></div>
					{/if}
				</dl>
			</div>

			<!-- ------------------------------------------- status panel --- -->
			<div class="a-card panel">
				<h2 class="ttl serif">ステータス操作</h2>

				{#if order.status === 'paid'}
					{#if !prepMode}
						<p class="lead">{statusHelp}</p>
						{#if missing.length}
							<p class="warnline">
								お届け先の{missing.join('・')}が未入力です。送り状の発行前に下の「お届け先」で補ってください。
							</p>
						{/if}
						<div class="a-row">
							<button class="a-btn primary" type="button" on:click={openPrep}>発送準備へ</button>
						</div>
					{:else}
						<!-- ------------------------------ shipping prep, 3 steps --- -->
						<form
							method="POST"
							action="?/ship"
							use:enhance
							class="stack prep"
							bind:this={prepForm}
						>
							<div class="step">
								<p class="step-no">① 作業内容の確認</p>
								<p class="step-lead">
									梱包しながら1件ずつチェックしてください。すべて確認できてから発送完了に進みます。
								</p>
								{#if prepWarned && !allChecked}
									<p class="warnline" role="alert">
										未確認の項目が{uncheckedCount}件あります。内容をもう一度お確かめください。
									</p>
								{/if}
								<ul class="checks">
									{#each checkRows as r (r.key)}
										<li class:done={checked[r.key]}>
											<label class="check">
												<input type="checkbox" bind:checked={checked[r.key]} />
												<span class="c-kind">{r.kind}</span>
												<span class="c-text">{r.text}</span>
											</label>
										</li>
									{/each}
								</ul>
							</div>

							<div class="step">
								<p class="step-no">② 配送情報の入力（任意）</p>
								<p class="step-lead">入力内容は発送完了メールに追記されます。</p>
								<div class="pair">
									<Field label="追跡番号" hint="空欄のままでも発送完了にできます。">
										<input
											class="a-input"
											name="tracking"
											value={tracking}
											on:input={onTracking}
											placeholder="0000-0000-0000"
											autocomplete="off"
										/>
									</Field>
									<Field
										label="配送業者"
										hint={carrierGuess
											? `${carrierGuess}と判定しました（変更できます）`
											: '追跡番号から自動で判定します。'}
									>
										<select
											class="a-select"
											name="carrier"
											bind:value={carrier}
											on:change={() => (carrierTouched = true)}
										>
											<option value="">（未選択）</option>
											{#each carrierOptions as c (c)}
												<option value={c}>{c}</option>
											{/each}
										</select>
									</Field>
								</div>
								<Field label="購入者への連絡事項" hint="発送完了メールの本文に追記されます。">
									<textarea class="a-textarea" name="message" rows="3" bind:value={message}
									></textarea>
								</Field>
								<label class="check">
									<input type="checkbox" name="notify" bind:checked={notify} />
									<span>お客さまに発送完了メールを送る</span>
								</label>
								<p class="a-muted small">※メール送信は未接続です（設定 &gt; 通知）。現時点では送信されません。</p>
							</div>

							<div class="step">
								<p class="step-no">③ 発送完了</p>
								<p class="step-lead">ステータスが「未発送」から「完了」に変わります。</p>
								<div class="a-row">
									<button class="a-btn primary" type="button" on:click={submitShip}>発送完了</button>
									<button class="a-btn" type="submit" formaction="?/prep">一時保存</button>
									<button class="a-btn ghost" type="button" on:click={() => (prepMode = false)}>
										やめる
									</button>
								</div>
							</div>
						</form>
					{/if}

					{#if !prepMode}
						<form method="POST" action="?/cancel" use:enhance class="stack sep">
							<label class="check">
								<input type="checkbox" name="restock" checked />
								<span>キャンセルと同時に在庫を戻す</span>
							</label>
							<div class="a-row">
								<ConfirmButton
									label="このオーダーをキャンセル"
									tone="danger"
									message="このオーダーをキャンセルします。取り消せません。よろしいですか？"
								/>
								<span class="a-muted small">返金はStripe管理画面で行い、下の「返金を記録」で帳簿に反映します。</span>
							</div>
						</form>
					{/if}
				{:else if order.status === 'shipped'}
					<p class="lead">
						{at(order.shipped_at)} に発送を完了しました。
						{#if order.tracking_no}
							追跡番号 <span class="a-num">{order.tracking_no}</span>
							{#if trackingUrl}
								<a class="link" href={trackingUrl} target="_blank" rel="noopener">追跡 ↗</a>
							{/if}
						{:else}
							追跡番号は未登録です。
						{/if}
					</p>

					<form method="POST" action="?/tracking" use:enhance class="stack">
						<Field label="追跡番号の修正" hint="発送日時はこの操作では変わりません。">
							<input
								class="a-input"
								name="tracking"
								value={order.tracking_no ?? ''}
								placeholder="0000-0000-0000"
								autocomplete="off"
							/>
						</Field>
						<div class="a-row">
							<button class="a-btn" type="submit">追跡番号を更新</button>
						</div>
					</form>

					<div class="sep">
						{#if !showRefund}
							<div class="a-row">
								<button class="a-btn" type="button" on:click={() => (showRefund = true)}>
									返金を記録
								</button>
							</div>
							<form method="POST" action="?/cancel" use:enhance class="stack cancel-shipped">
								<label class="check">
									<input type="checkbox" name="restock" />
									<span>キャンセルと同時に在庫を戻す（返送品が手元にある場合）</span>
								</label>
								<div class="a-row">
									<ConfirmButton
										label="このオーダーをキャンセル扱いにする"
										tone="danger"
										message="完了したオーダーをキャンセル扱いにします。取り消せません。よろしいですか？"
									/>
								</div>
							</form>
						{:else}
							<form method="POST" action="?/refund" use:enhance class="stack">
								<p class="lead">
									返金可能額は {yen(refundable)} です。Stripe側の返金処理はこの画面では行いません。
								</p>
								<div class="pair">
									<Field label="返金額（円）" required>
										<input
											class="a-input"
											name="amount"
											type="number"
											min="1"
											max={refundable}
											value={refundable}
											inputmode="numeric"
										/>
									</Field>
									<Field label="理由" hint="メモにも同じ内容が追記されます。">
										<input class="a-input" name="reason" placeholder="例）お客様都合による返品" />
									</Field>
								</div>
								<div class="a-row">
									<ConfirmButton
										label="返金を記録"
										message="返金を記録します。実際の返金はStripe管理画面で別途行ってください。よろしいですか？"
									/>
									<button class="a-btn ghost" type="button" on:click={() => (showRefund = false)}>
										やめる
									</button>
								</div>
							</form>
						{/if}
					</div>
				{:else if order.status === 'canceled'}
					<p class="lead">
						{#if cancelEvent}{at(cancelEvent.at)} にキャンセルされました。{cancelEvent.detail}
						{:else}このオーダーはキャンセルされています。{/if}
					</p>
					<p class="a-muted small">キャンセル済みの注文に対する操作はありません。記録の閲覧と納品書の印刷のみ行えます。</p>
				{:else if order.status === 'refunded'}
					<p class="lead">
						{#if lastRefund}{at(lastRefund.at)} に返金を記録しました（累計 {yen(refunded)}）。
						{:else}返金済みです（累計 {yen(refunded)}）。{/if}
					</p>
					{#if refundable > 0}
						<!-- partial refund: the rest is still refundable, so keep the lever -->
						<p class="a-muted small">未返金の残額が {yen(refundable)} あります。</p>
						{#if !showRefund}
							<div class="a-row">
								<button class="a-btn" type="button" on:click={() => (showRefund = true)}>
									追加の返金を記録
								</button>
							</div>
						{:else}
							<form method="POST" action="?/refund" use:enhance class="stack">
								<div class="pair">
									<Field label="返金額（円）" required>
										<input
											class="a-input"
											name="amount"
											type="number"
											min="1"
											max={refundable}
											value={refundable}
											inputmode="numeric"
										/>
									</Field>
									<Field label="理由">
										<input class="a-input" name="reason" placeholder="例）一部返品" />
									</Field>
								</div>
								<div class="a-row">
									<ConfirmButton
										label="返金を記録"
										message="追加の返金を記録します。よろしいですか？"
									/>
									<button class="a-btn ghost" type="button" on:click={() => (showRefund = false)}>
										やめる
									</button>
								</div>
							</form>
						{/if}
					{:else}
						<p class="a-muted small">全額の返金が記録されています。追加の操作はありません。</p>
					{/if}
				{:else}
					<p class="lead">決済がまだ完了していません。完了すると「未発送」になります。</p>
				{/if}
			</div>

			<!-- ------------------------------------------------- items --- -->
			<div class="a-card">
				<h2 class="ttl serif">ご注文内容</h2>
				<div class="a-table-scroll">
					<table class="a-table">
						<thead>
							<tr>
								<th>商品</th>
								<th class="num">単価</th>
								<th class="num">数量</th>
								<th class="num">小計</th>
							</tr>
						</thead>
						<tbody>
							{#each items as it, i (it.product_id ?? i)}
								<tr>
									<td class="strong">{it.name}</td>
									<td class="num">{yen(it.price)}</td>
									<td class="num">{it.qty}</td>
									<td class="num">{yen(it.price * it.qty)}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>

				<dl class="totals">
					<div><dt>小計</dt><dd>{yen(order.subtotal)}</dd></div>
					<div>
						<dt>送料</dt>
						<dd>{order.shipping === 0 ? '無料' : yen(order.shipping)}</dd>
					</div>
					<div class="grand"><dt>合計</dt><dd>{yen(order.total)}</dd></div>
					{#if refunded > 0}
						<div><dt>返金済み</dt><dd class="neg">− {yen(refunded)}</dd></div>
						<div><dt>差引</dt><dd>{yen(Number(order.total) - refunded)}</dd></div>
					{/if}
				</dl>
			</div>

			<!-- ---------------------------------------------- shipping --- -->
			<div class="a-card">
				<div class="ttl-row">
					<h2 class="ttl serif">お届け先</h2>
					<button class="a-btn small" type="button" on:click={copyAddress}>
						{copied ? 'コピーしました' : '住所をコピー'}
					</button>
				</div>

				<form method="POST" action="?/shipping" use:enhance class="stack">
					<div class="pair">
						<Field label="氏名" required>
							<input class="a-input" name="name" value={order.name ?? ''} autocomplete="off" />
						</Field>
						<Field label="電話番号" hint="送り状の必須項目です。">
							<input
								class="a-input"
								name="phone"
								value={order.phone ?? ''}
								inputmode="tel"
								autocomplete="off"
							/>
						</Field>
					</div>

					<Field label="メールアドレス" hint="変更すると顧客ページの集計先も変わります。">
						<input
							class="a-input"
							name="email"
							type="email"
							value={order.email ?? ''}
							autocomplete="off"
						/>
					</Field>

					<div class="pair">
						<Field label="郵便番号">
							<input class="a-input" name="zip" value={addr.zip ?? ''} placeholder="150-0001" />
						</Field>
						<Field label="都道府県">
							<input class="a-input" name="state" value={addr.state ?? ''} placeholder="東京都" />
						</Field>
					</div>

					<div class="pair">
						<Field label="市区町村">
							<input class="a-input" name="city" value={addr.city ?? ''} placeholder="渋谷区神宮前" />
						</Field>
						<Field label="番地">
							<input class="a-input" name="line1" value={addr.line1 ?? ''} placeholder="1-2-3" />
						</Field>
					</div>

					<Field label="建物名・部屋番号">
						<input class="a-input" name="line2" value={addr.line2 ?? ''} placeholder="メゾンA 101" />
					</Field>

					<div class="pair">
						<Field label="配達時間帯">
							<select class="a-select" name="delivery_note">
								{#each slotOptions as s (s.value)}
									<option value={s.value} selected={s.value === (order.delivery_note ?? '')}>
										{s.label}
									</option>
								{/each}
							</select>
						</Field>
						<Field label="ギフト包装">
							<label class="check tall">
								<input type="checkbox" name="gift" checked={!!order.gift} />
								<span>希望する</span>
							</label>
						</Field>
					</div>

					<div class="a-row">
						<button class="a-btn primary" type="submit">お届け先を保存</button>
						{#if form && form.saved === 'shipping'}
							<span class="ok">保存しました</span>
						{/if}
					</div>
				</form>
			</div>

			<!-- -------------------------------------------------- note --- -->
			<div class="a-card">
				<h2 class="ttl serif">メモ</h2>
				<form method="POST" action="?/note" use:enhance class="stack">
					<Field label="社内メモ" hint="お客様には表示されません。返金理由も自動で追記されます。">
						<textarea class="a-textarea" name="note" rows="5">{order.note ?? ''}</textarea>
					</Field>
					<div class="a-row">
						<button class="a-btn" type="submit">メモを保存</button>
						{#if form && form.saved === 'note'}
							<span class="ok">保存しました</span>
						{/if}
					</div>
				</form>
			</div>
		</div>

		<!-- ======================================================== side --- -->
		<aside class="side">
			<div class="a-card">
				<h2 class="ttl serif">お客様</h2>
				<p class="cust-name">{order.name || '（氏名未登録）'}</p>
				<p class="a-muted small break">{order.email || '（メール未登録）'}</p>
				{#if data.customer}
					<dl class="mini">
						<div><dt>これまでのご注文</dt><dd class="a-num">{data.customer.stats.count} 回</dd></div>
						<div><dt>累計購入額</dt><dd class="a-num">{yen(data.customer.stats.total)}</dd></div>
						<div><dt>初回</dt><dd>{at(data.customer.stats.first_at)}</dd></div>
					</dl>
					{#if data.customer.tags && data.customer.tags.length}
						<div class="tags">
							{#each data.customer.tags as t (t)}<span class="a-chip">{t}</span>{/each}
						</div>
					{/if}
					<a class="a-btn small" href="/shop/edit/customers/{encodeURIComponent(data.customer.email)}">
						顧客ページを開く
					</a>
				{:else}
					<p class="a-muted small">メールアドレスがないため、顧客としての集計はありません。</p>
				{/if}
			</div>

			<div class="a-card">
				<h2 class="ttl serif">履歴</h2>
				<ol class="timeline">
					<li>
						<span class="t-at a-num">{at(order.created_at)}</span>
						<span class="t-label">ご注文</span>
					</li>
					{#each data.events as e (e.id)}
						{#if e.action !== 'order.paid'}
							<li>
								<span class="t-at a-num">{at(e.at)}</span>
								<span class="t-label">{ACTION_LABEL[e.action] ?? e.action}</span>
								{#if e.detail}<span class="t-detail">{e.detail}</span>{/if}
								{#if e.actor && e.actor !== 'admin'}<span class="t-actor">{e.actor}</span>{/if}
							</li>
						{/if}
					{/each}
				</ol>
			</div>

			<div class="a-card">
				<h2 class="ttl serif">操作</h2>
				<div class="side-acts">
					<a
						class="a-btn"
						href="/shop/edit/orders/{order.id}/print"
						target="_blank"
						rel="noopener">納品書を印刷 ↗</a
					>
					<a class="a-btn" href="/shop/api/admin/b2?ids={order.id}" download>
						B2 CSV（このオーダー）
					</a>
					<a class="a-btn" href="/shop/edit/orders/picklist">ピックリスト ↗</a>
					<a class="a-btn ghost" href="/shop/edit/orders">← オーダー一覧へ戻る</a>
				</div>
			</div>
		</aside>
	</div>
</AdminShell>

<style>
	.head-acts {
		display: flex;
		flex-wrap: wrap;
		gap: 0.8rem;
	}

	.banner {
		margin-bottom: 2.4rem;
		padding: 1.1rem 1.4rem;
		border: 1px solid var(--a-line);
		border-radius: 3px;
		font-size: 1.15rem;
		line-height: 1.7;
		text-align: left;
	}
	.banner.good {
		border-color: #d5e0d7;
		background-color: #f7faf7;
		color: #4d6b57;
	}
	.banner.danger {
		border-color: #e5c8c2;
		background-color: #fdf5f3;
		color: #a3453a;
	}

	.cols {
		display: grid;
		gap: 2rem;
		align-items: start;
	}
	.main,
	.side {
		display: flex;
		flex-direction: column;
		gap: 2rem;
		min-width: 0;
	}

	/* -------------------------------------------------------- summary --- */
	.sum-top {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1.8rem;
	}
	.ono {
		font-size: 1.9rem;
		line-height: 1.2;
		color: var(--blackColor);
		letter-spacing: 0.05em;
	}
	.meta {
		display: grid;
		gap: 1.2rem 2.4rem;
		grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
	}
	.meta dt,
	.mini dt {
		font-size: 1rem;
		line-height: 1.4;
		letter-spacing: 0.04em;
		color: var(--subColor);
		margin-bottom: 0.4rem;
	}
	.meta dd {
		font-size: 1.25rem;
		line-height: 1.5;
		color: var(--textColor);
	}
	.meta dd.strong {
		color: var(--blackColor);
	}
	.neg {
		color: #a3453a;
	}

	/* ---------------------------------------------------------- cards --- */
	.ttl {
		font-size: 1.4rem;
		line-height: 1.4;
		color: var(--blackColor);
		margin-bottom: 1.6rem;
	}
	.ttl-row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 1.6rem;
	}
	.ttl-row .ttl {
		margin-bottom: 0;
	}
	.lead {
		font-size: 1.2rem;
		line-height: 1.8;
		text-align: left;
		color: var(--textColor);
		margin-bottom: 1.6rem;
	}
	.small {
		font-size: 1.05rem;
		line-height: 1.7;
	}
	.warnline {
		padding: 0.9rem 1.2rem;
		margin-bottom: 1.6rem;
		border: 1px solid #e8d3ae;
		border-radius: 3px;
		background-color: #fdf9f2;
		color: #8a6224;
		font-size: 1.1rem;
		line-height: 1.7;
		text-align: left;
	}
	.stack {
		display: flex;
		flex-direction: column;
		gap: 1.6rem;
	}
	.sep {
		margin-top: 2.4rem;
		padding-top: 2.4rem;
		border-top: 1px solid var(--a-line-soft);
	}
	.pair {
		display: grid;
		gap: 1.6rem;
		grid-template-columns: 1fr;
	}
	.check {
		display: inline-flex;
		align-items: center;
		gap: 0.7rem;
		font-size: 1.15rem;
		line-height: 1.5;
		color: var(--textColor);
		cursor: pointer;
	}
	.check.tall {
		min-height: 3.9rem;
	}
	.cancel-shipped {
		margin-top: 1.8rem;
	}
	.link {
		color: var(--blackColor);
		border-bottom: 1px solid #ccc;
	}
	.ok {
		font-size: 1.05rem;
		color: #4d6b57;
	}

	/* --------------------------------------------------------- totals --- */
	.totals {
		display: flex;
		flex-direction: column;
		gap: 0.7rem;
		margin-top: 1.8rem;
		margin-left: auto;
		width: min(100%, 30rem);
	}
	.totals div {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 2rem;
	}
	.totals dt {
		font-size: 1.1rem;
		color: var(--subColor);
	}
	.totals dd {
		font-size: 1.2rem;
		color: var(--textColor);
		font-variant-numeric: tabular-nums;
	}
	.totals .grand {
		margin-top: 0.7rem;
		padding-top: 1rem;
		border-top: 1px solid var(--a-line);
	}
	.totals .grand dt {
		font-size: 1.2rem;
		color: var(--textColor);
	}
	.totals .grand dd {
		font-size: 1.7rem;
		color: var(--blackColor);
	}

	/* ----------------------------------------------------------- side --- */
	.cust-name {
		font-size: 1.35rem;
		line-height: 1.5;
		text-align: left;
		color: var(--blackColor);
	}
	.break {
		word-break: break-all;
		margin-top: 0.3rem;
	}
	.mini {
		display: flex;
		flex-direction: column;
		gap: 1.1rem;
		margin: 1.8rem 0;
	}
	.mini div {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 1.2rem;
	}
	.mini dt {
		margin-bottom: 0;
	}
	.mini dd {
		font-size: 1.2rem;
		color: var(--blackColor);
	}
	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-bottom: 1.6rem;
	}

	.timeline {
		display: flex;
		flex-direction: column;
		gap: 1.4rem;
	}
	.timeline li {
		display: grid;
		gap: 0.2rem;
		padding-left: 1.4rem;
		border-left: 1px solid var(--a-line);
		position: relative;
	}
	.timeline li::before {
		content: '';
		position: absolute;
		left: -2.5px;
		top: 0.55rem;
		width: 5px;
		height: 5px;
		border-radius: 50%;
		background-color: #cfcac5;
	}
	.t-at {
		font-size: 1rem;
		color: var(--subColor);
	}
	.t-label {
		font-size: 1.15rem;
		line-height: 1.5;
		color: var(--textColor);
	}
	.t-detail,
	.t-actor {
		font-size: 1.05rem;
		line-height: 1.6;
		color: var(--subColor);
		word-break: break-all;
	}

	/* ------------------------------------------------- shipping prep --- */
	.prep {
		gap: 2.4rem;
	}
	.step {
		padding-top: 2rem;
		border-top: 1px solid var(--a-line-soft);
	}
	.step:first-child {
		padding-top: 0;
		border-top: none;
	}
	.step-no {
		font-size: 1.25rem;
		line-height: 1.5;
		text-align: left;
		color: var(--blackColor);
		letter-spacing: 0.04em;
	}
	.step-lead {
		margin: 0.5rem 0 1.4rem;
		font-size: 1.1rem;
		line-height: 1.7;
		text-align: left;
		color: var(--subColor);
	}
	.checks {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}
	.checks li {
		padding: 0.9rem 1.1rem;
		border: 1px solid var(--a-line-soft);
		border-radius: 3px;
		background-color: #fdfdfc;
	}
	.checks li + li {
		margin-top: 0.6rem;
	}
	.checks li.done {
		border-color: #d5e0d7;
		background-color: #f8fbf8;
	}
	.checks .check {
		display: flex;
		align-items: baseline;
		gap: 0.9rem;
		width: 100%;
	}
	.c-kind {
		flex: none;
		min-width: 6.5rem;
		font-size: 1rem;
		color: var(--subColor);
		letter-spacing: 0.04em;
	}
	.c-text {
		font-size: 1.15rem;
		line-height: 1.6;
		color: var(--textColor);
	}
	.step .a-textarea,
	.step .check {
		margin-bottom: 0;
	}
	.step > .check {
		margin-top: 1.4rem;
	}
	.step > .a-muted {
		margin-top: 0.5rem;
	}

	.side-acts {
		display: flex;
		flex-direction: column;
		align-items: stretch;
		gap: 0.8rem;
	}

	/* ---------------------------------------------------------- ≥760px --- */
	@media screen and (min-width: 760px) {
		.pair {
			grid-template-columns: 1fr 1fr;
		}
	}

	/* ---------------------------------------------------------- ≥1060px -- */
	@media screen and (min-width: 1060px) {
		.cols {
			grid-template-columns: minmax(0, 1fr) 32rem;
			gap: 2.4rem;
		}
		.main,
		.side {
			gap: 2.4rem;
		}
	}
</style>
