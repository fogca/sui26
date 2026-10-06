<script>
	import { enhance } from '$app/forms';
	import AdminShell from '$lib/admin/AdminShell.svelte';
	import Section from '$lib/admin/Section.svelte';
	import Field from '$lib/admin/Field.svelte';
	import Badge from '$lib/admin/Badge.svelte';
	import { yen } from '$lib/shop/money.js';

	export let data;
	export let form;

	$: s = data.settings;
	$: tab = data.tab;
	$: tabs = data.tabs;

	// Live copies for the fields whose value we echo back as a preview. They are
	// re-seeded whenever the server sends fresh settings (i.e. after a save).
	let shippingFee = 0;
	let freeOver = 0;
	$: shippingFee = s.shipping_fee;
	$: freeOver = s.free_over;

	$: shippingPreview =
		Number(freeOver) > 0
			? `${yen(freeOver)}以上のご注文は送料無料。それ未満は全国一律 ${yen(shippingFee)}。`
			: `すべてのご注文に送料 ${yen(shippingFee)} がかかります（送料無料の設定なし）。`;

	$: isLive = s.payment_mode === 'live';
	$: saved = form?.ok && form.tab === tab;
	$: errorMsg = form && form.error && form.tab === tab ? form.error : '';
	$: errorField = form && form.field && form.tab === tab ? form.field : '';

	let saving = false;

	function errFor(field) {
		return errorField === field ? errorMsg : '';
	}

	/** Settings that change what customers are charged or how orders are billed
	 *  never save on a single click. */
	function riskyOk(formData) {
		const t = String(formData.get('tab') ?? '');

		if (t === 'shipping') {
			const fee = Number(formData.get('shipping_fee'));
			const over = Number(formData.get('free_over'));
			if (over === 0 && Number(s.free_over) !== 0) {
				return confirm(
					'送料無料ラインを 0 円にすると、すべてのご注文が送料無料になります。よろしいですか？'
				);
			}
			if (fee === 0 && Number(s.shipping_fee) !== 0) {
				return confirm('送料を 0 円にすると、全国どこでも送料を頂かない設定になります。よろしいですか？');
			}
		}

		if (t === 'payment') {
			const mode = String(formData.get('payment_mode') ?? '');
			if (mode === 'live' && s.payment_mode !== 'live') {
				return confirm(
					'本番決済モードに切り替えます。以後、お客様のカードから実際に代金が引き落とされます。よろしいですか？'
				);
			}
			if (mode === 'mock' && s.payment_mode === 'live') {
				return confirm(
					'モック（テスト）決済に戻します。以後、実際の決済は行われません。よろしいですか？'
				);
			}
		}

		if (t === 'ops') {
			const prefix = String(formData.get('order_prefix') ?? '');
			if (prefix !== s.order_prefix) {
				return confirm(
					`注文番号の接頭辞を「${s.order_prefix}」から「${prefix}」に変更します。これ以降の注文番号が変わります。よろしいですか？`
				);
			}
		}

		return true;
	}

	function onSave({ formData, cancel }) {
		if (!riskyOk(formData)) {
			cancel();
			return;
		}
		saving = true;
		// reset:false — the form must keep showing what was just saved
		return async ({ update }) => {
			await update({ reset: false });
			saving = false;
		};
	}
</script>

<AdminShell title="設定" section="settings" subtitle="店舗・配送・決済・法定表記をここで管理します">
	<span slot="actions">
		<Badge tone={isLive ? 'warn' : 'info'} label={isLive ? '本番決済モード' : 'モック決済モード'} />
	</span>

	<nav class="tabs" aria-label="設定カテゴリ">
		{#each tabs as t (t.key)}
			<a
				class="tab"
				class:current={tab === t.key}
				href="?tab={t.key}"
				aria-current={tab === t.key ? 'page' : undefined}
			>
				{t.label}
			</a>
		{/each}
	</nav>

	<form method="POST" use:enhance={onSave} class="sform">
		<input type="hidden" name="tab" value={tab} />

		{#if tab === 'store'}
			<Section title="店舗情報" desc="注文確認メールやサイトの表示に使う、店舗の基本情報です。">
				<div class="grid">
					<Field label="店舗名" hint="お客様に表示される名前です">
						<input class="a-input" name="store_name" value={s.store_name} autocomplete="off" />
					</Field>
					<Field
						label="店舗メールアドレス"
						hint="お客様からの問い合わせ先"
						error={errFor('store_email')}
					>
						<input
							class="a-input"
							name="store_email"
							type="email"
							value={s.store_email}
							placeholder="hello@example.com"
						/>
					</Field>
					<Field label="電話番号" hint="任意。特商法ページの電話番号とは別に管理できます">
						<input class="a-input" name="store_phone" value={s.store_phone} placeholder="03-0000-0000" />
					</Field>
					<Field label="サイトURL" hint="https:// から入力" error={errFor('store_url')}>
						<input
							class="a-input"
							name="store_url"
							value={s.store_url}
							placeholder="https://sui-sari.com"
						/>
					</Field>
				</div>
			</Section>
		{:else if tab === 'shipping'}
			<Section title="配送" desc="カートと商品ページの送料表示は、この設定から計算されます。">
				<div class="grid">
					<Field label="送料（全国一律・円）" error={errFor('shipping_fee')}>
						<input
							class="a-input"
							name="shipping_fee"
							type="number"
							min="0"
							step="1"
							bind:value={shippingFee}
						/>
					</Field>
					<Field
						label="送料無料ライン（円）"
						hint="0 にすると「すべて送料無料」になります"
						error={errFor('free_over')}
					>
						<input
							class="a-input"
							name="free_over"
							type="number"
							min="0"
							step="1"
							bind:value={freeOver}
						/>
					</Field>
				</div>

				<p class="preview"><span class="preview-k">お客様への表示</span>{shippingPreview}</p>

				<div class="grid">
					<Field label="配送業者" hint="送り状の発行やお知らせ文面に使います">
						<input class="a-input" name="shipping_carrier" value={s.shipping_carrier} />
					</Field>
					<Field label="発送までの日数（表示文）">
						<input
							class="a-input"
							name="ship_days_note"
							value={s.ship_days_note}
							placeholder="ご注文から3営業日以内に発送"
						/>
					</Field>
				</div>
				<Field
					label="受付締切のご案内（任意）"
					hint="例: 平日15時以降のご注文は翌営業日の受付となります"
				>
					<input class="a-input" name="cutoff_note" value={s.cutoff_note} />
				</Field>
			</Section>
		{:else if tab === 'payment'}
			<Section title="決済" desc="決済の動作モードと、価格表示まわりの文言です。">
				<div class="note" class:live={isLive}>
					<strong>現在のモード</strong>
					{#if isLive}
						<p>
							<b>本番</b>です。チェックアウトで実際の支払いが発生します。
						</p>
					{:else}
						<p>
							<b>モック（テスト）</b>です。チェックアウトは疑似決済で完了し、実際の請求は発生しません。
						</p>
					{/if}
					<p class="a-muted">
						Stripeのシークレットキーは環境変数（Cloudflare の secret）で管理しています。この画面では設定しません。
					</p>
				</div>

				<div class="grid">
					<Field
						label="決済モード"
						hint="本番に切り替える前に、Stripeの鍵とWebhookの設定を済ませてください"
						error={errFor('payment_mode')}
					>
						<!-- selected is written explicitly so the control always shows the
						     stored mode, never the first option by default -->
						<select class="a-select" name="payment_mode">
							<option value="mock" selected={s.payment_mode !== 'live'}>
								モック（テスト・実際の請求なし）
							</option>
							<option value="live" selected={s.payment_mode === 'live'}>
								本番（実際に決済する）
							</option>
						</select>
					</Field>
					<Field label="通貨" hint="現在は日本円のみ対応しています">
						<select class="a-select" name="currency">
							<option value="JPY" selected>JPY（日本円）</option>
						</select>
					</Field>
				</div>
				<Field label="価格の注記" hint="商品ページ・カートに表示されます">
					<input class="a-input" name="tax_note" value={s.tax_note} />
				</Field>
			</Section>
		{:else if tab === 'legal'}
			<Section
				title="特定商取引法に基づく表記"
				desc="ここに入力した内容が、そのまま公開ページ /shop/legal に表示されます。未入力の項目は公開ページに表示されません。"
			>
				<p class="linkline">
					<a class="a-btn small" href="/shop/legal" target="_blank" rel="noopener">
						公開ページを確認 ↗
					</a>
				</p>

				<div class="grid">
					<Field label="販売事業者" hint="未入力の場合は店舗名を表示します">
						<input class="a-input" name="legal_seller" value={s.legal_seller} />
					</Field>
					<Field label="運営責任者" hint="例: 磯部 沙里">
						<input class="a-input" name="legal_manager" value={s.legal_manager} />
					</Field>
					<Field label="郵便番号" hint="例: 150-0001">
						<input class="a-input" name="legal_zip" value={s.legal_zip} />
					</Field>
					<Field label="所在地" hint="例: 東京都渋谷区神宮前0-0-0">
						<input class="a-input" name="legal_address" value={s.legal_address} />
					</Field>
					<Field label="電話番号" hint="例: 03-0000-0000">
						<input class="a-input" name="legal_tel" value={s.legal_tel} />
					</Field>
					<Field label="電話受付時間" hint="例: 平日 11:00〜17:00（電話番号が未入力なら表示されません）">
						<input class="a-input" name="legal_tel_hours" value={s.legal_tel_hours} />
					</Field>
					<Field label="メールアドレス" error={errFor('legal_email')}>
						<input
							class="a-input"
							name="legal_email"
							type="email"
							value={s.legal_email}
							placeholder="hello@example.com"
						/>
					</Field>
					<Field label="商品代金以外の必要料金" hint="例: 送料 全国一律800円（11,000円以上で無料）">
						<input class="a-input" name="legal_extra_fees" value={s.legal_extra_fees} />
					</Field>
					<Field
						label="お支払い方法"
						hint="例: クレジットカード / Apple Pay / PayPay / コンビニ決済"
					>
						<input class="a-input" name="legal_payment_methods" value={s.legal_payment_methods} />
					</Field>
					<Field label="お支払い時期" hint="例: ご注文時にお支払いが確定します">
						<input class="a-input" name="legal_payment_timing" value={s.legal_payment_timing} />
					</Field>
				</div>

				<Field label="商品の引き渡し時期" hint="例: ご注文から3営業日以内に発送します">
					<input class="a-input" name="legal_delivery_timing" value={s.legal_delivery_timing} />
				</Field>
				<Field
					label="返品・交換について"
					hint="例: 香りの性質上、お客様都合による返品はお受けしておりません。"
				>
					<textarea
						class="a-textarea"
						name="legal_return_policy"
						rows="4"
						value={s.legal_return_policy}
					></textarea>
				</Field>
				<Field label="返品時の送料負担" hint="例: お客様都合の場合はお客様負担、不良品の場合は当方負担">
					<input class="a-input" name="legal_return_shipping" value={s.legal_return_shipping} />
				</Field>
				<Field
					label="不良品について"
					hint="例: 商品到着後7日以内にご連絡ください。送料当方負担でお取り替えいたします。"
				>
					<textarea
						class="a-textarea"
						name="legal_defect_policy"
						rows="4"
						value={s.legal_defect_policy}
					></textarea>
				</Field>
			</Section>
		{:else if tab === 'notify'}
			<Section title="通知" desc="注文・発送のお知らせメールに関する設定です。">
				<div class="note warn">
					<strong>メール送信はまだ接続されていません</strong>
					<p>
						この設定は保存されますが、現時点では注文・発送のメールは<b>送信されません</b>。
						送信基盤（Resend等）を接続したあとに有効になります。
						新しいオーダーはオーダー一覧で確認してください。
					</p>
				</div>

				<div class="grid">
					<Field
						label="通知先メールアドレス"
						hint="注文が入ったときの受け取り先"
						error={errFor('notify_order_to')}
					>
						<input
							class="a-input"
							name="notify_order_to"
							type="email"
							value={s.notify_order_to}
							placeholder="orders@example.com"
						/>
					</Field>
					<Field label="BCC" hint="カンマ区切りで複数指定できます" error={errFor('notify_bcc')}>
						<input class="a-input" name="notify_bcc" value={s.notify_bcc} />
					</Field>
					<Field
						label="送信元メールアドレス"
						hint="お客様に届くメールのFrom"
						error={errFor('mail_from')}
					>
						<input
							class="a-input"
							name="mail_from"
							type="email"
							value={s.mail_from}
							placeholder="noreply@example.com"
						/>
					</Field>
				</div>

				<Field label="メール署名" hint="お客様へのメール末尾に付きます">
					<textarea
						class="a-textarea"
						name="mail_signature"
						rows="4"
						value={s.mail_signature}
					></textarea>
				</Field>

				<div class="checks">
					<label class="check">
						<input type="checkbox" name="notify_on_order" checked={s.notify_on_order === '1'} />
						<span>注文が入ったら通知する</span>
					</label>
					<label class="check">
						<input type="checkbox" name="notify_on_ship" checked={s.notify_on_ship === '1'} />
						<span>発送を登録したらお客様にお知らせする</span>
					</label>
				</div>
			</Section>
		{:else if tab === 'b2'}
			<Section
				title="ご依頼主情報（B2送り状用）"
				desc="ヤマトB2クラウドに取り込むCSVの「ご依頼主」欄に入ります。"
			>
				<Field label="名前">
					<input class="a-input" name="sender_name" value={s.sender_name} />
				</Field>
				<div class="grid">
					<Field label="郵便番号">
						<input class="a-input" name="sender_zip" value={s.sender_zip} placeholder="150-0001" />
					</Field>
					<Field label="電話番号">
						<input class="a-input" name="sender_tel" value={s.sender_tel} placeholder="03-0000-0000" />
					</Field>
				</div>
				<Field label="住所">
					<input class="a-input" name="sender_addr" value={s.sender_addr} placeholder="東京都渋谷区…" />
				</Field>
			</Section>

			<Section
				title="ヤマトB2契約情報"
				desc="B2クラウドの契約情報画面で確認できます。CSV取込で請求先を決める値なので正確に入力してください。"
			>
				<div class="grid">
					<Field label="ご請求先顧客コード">
						<input class="a-input" name="b2_customer_code" value={s.b2_customer_code} />
					</Field>
					<Field label="運賃管理番号">
						<input class="a-input" name="b2_fare_no" value={s.b2_fare_no} placeholder="01" />
					</Field>
				</div>
			</Section>
		{:else if tab === 'ops'}
			<Section title="運用" desc="在庫アラートと注文番号の設定です。">
				<div class="grid">
					<Field
						label="在庫僅少のしきい値"
						hint="この数以下になったら在庫アラートに出ます"
						error={errFor('low_stock_threshold')}
					>
						<input
							class="a-input"
							name="low_stock_threshold"
							type="number"
							min="0"
							step="1"
							value={s.low_stock_threshold}
						/>
					</Field>
					<Field
						label="注文番号の接頭辞"
						hint="例: SUI → SUI-20260730-0001。半角英数字・ハイフン 1〜8文字"
						error={errFor('order_prefix')}
					>
						<input class="a-input" name="order_prefix" value={s.order_prefix} />
					</Field>
					<Field label="タイムゾーン" hint="現在は日本時間のみ対応しています">
						<select class="a-select" name="timezone">
							<option value="Asia/Tokyo" selected>Asia/Tokyo（日本時間）</option>
						</select>
					</Field>
				</div>
			</Section>
		{/if}

		<div class="foot">
			<button class="a-btn primary" type="submit" disabled={saving}>
				{saving ? '保存中…' : '保存'}
			</button>

			{#if errorMsg}
				<p class="msg err" role="alert">{errorMsg}</p>
			{:else if saved}
				<p class="msg ok" role="status">
					保存しました<span class="a-muted">（{form.at} / {form.count}項目）</span>
				</p>
			{:else}
				<p class="msg a-muted">このタブの項目だけが保存されます。</p>
			{/if}
		</div>
	</form>
</AdminShell>

<style>
	/* ------------------------------------------------------------- tabs --- */
	.tabs {
		display: flex;
		gap: 2rem;
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
		border-bottom: 1px solid #f0eeec;
		margin-bottom: 3.2rem;
		scrollbar-width: none;
	}
	.tabs::-webkit-scrollbar {
		display: none;
	}
	.tab {
		position: relative;
		flex: none;
		padding: 0 0 1.2rem;
		font-size: 1.15rem;
		letter-spacing: 0.04em;
		white-space: nowrap;
		color: var(--subColor);
		transition: color 0.18s ease;
	}
	.tab:hover {
		opacity: 1;
		color: var(--textColor);
	}
	.tab.current {
		color: var(--blackColor);
	}
	.tab.current::after {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		bottom: -1px;
		height: 1px;
		background-color: var(--blackColor);
	}

	/* ------------------------------------------------------------- form --- */
	.sform {
		max-width: 76rem;
	}
	.grid {
		display: grid;
		gap: 1.6rem 2.4rem;
		grid-template-columns: 1fr;
		margin-bottom: 1.6rem;
	}
	.sform :global(.field) {
		margin-bottom: 1.6rem;
	}
	.grid :global(.field) {
		margin-bottom: 0;
	}

	.preview {
		margin: 0 0 2.4rem;
		padding: 1.2rem 1.4rem;
		border: 1px solid var(--a-line, #eee);
		border-radius: 3px;
		background-color: #fff;
		font-size: 1.15rem;
		line-height: 1.7;
		text-align: left;
		color: var(--textColor);
	}
	.preview-k {
		display: block;
		margin-bottom: 0.3rem;
		font-size: 1rem;
		letter-spacing: 0.06em;
		color: var(--subColor);
	}

	.note {
		margin-bottom: 2.4rem;
		padding: 1.4rem 1.6rem;
		border: 1px solid #d3dae1;
		border-radius: 3px;
		background-color: #f6f8fa;
	}
	.note.live {
		border-color: #e8d3ae;
		background-color: #fdf9f2;
	}
	.note.warn {
		border-color: #e8d3ae;
		background-color: #fdf9f2;
	}
	.note strong {
		display: block;
		margin-bottom: 0.5rem;
		font-size: 1.1rem;
		letter-spacing: 0.04em;
		color: var(--blackColor);
	}
	.note p {
		font-size: 1.1rem;
		line-height: 1.8;
		text-align: left;
	}
	.note p + p {
		margin-top: 0.6rem;
	}
	.note b {
		color: var(--blackColor);
	}

	.linkline {
		margin-bottom: 2rem;
	}

	.checks {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-top: 0.8rem;
	}
	.check {
		display: flex;
		align-items: center;
		gap: 0.8rem;
		font-size: 1.15rem;
		line-height: 1.5;
		color: var(--textColor);
		cursor: pointer;
	}
	.check input {
		width: 1.6rem;
		height: 1.6rem;
		accent-color: var(--blackColor);
		cursor: pointer;
	}

	/* -------------------------------------------------------------- foot -- */
	.foot {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 1.6rem;
		margin-top: 3.2rem;
		padding-top: 2.4rem;
		border-top: 1px solid #f0eeec;
	}
	.msg {
		font-size: 1.1rem;
		line-height: 1.6;
		text-align: left;
	}
	.msg span {
		margin-left: 0.6rem;
	}
	.ok {
		color: #4d6b57;
	}
	.err {
		color: #a3453a;
	}

	@media screen and (min-width: 720px) {
		.grid {
			grid-template-columns: 1fr 1fr;
		}
	}
</style>
