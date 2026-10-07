<script>
	// Local stand-in for the Stripe hosted checkout page (mock mode only).
	// Exercises the same fulfillment path via /shop/api/mock-pay.
	//
	// Reachable only when SHOP_MOCK=1 and no Stripe key is set — a configured
	// shop redirects to Stripe instead, and /shop/api/mock-pay 404s — so no
	// real visitor ever lands here. It is dressed in the direction's type and
	// hairlines so it does not jar while developing, but it carries no site
	// chrome, the same way the hosted page it stands in for carries none.
	import { page } from '$app/stores';
	import { yen } from '$lib/shop/money.js';
	import { clearCart } from '$lib/shop/cart.js';
	import { TIME_SLOTS } from '$lib/shop/stripe.js';

	let cartData = null;
	let busy = false;
	let errorMsg = '';
	// stable per-page session id -> double-submits stay idempotent server-side
	const sessionId = 'mock_' + crypto.randomUUID();

	const customer = {
		name: 'テスト 購入者',
		email: 'test@example.com',
		phone: '090-0000-0000',
		zip: '150-0001',
		state: '東京都',
		city: '渋谷区',
		line1: '神宮前 1-1-1',
		timeslot: 'none',
		gift: false,
		note: ''
	};

	$: {
		try {
			const raw = $page.url.searchParams.get('cart');
			cartData = raw ? JSON.parse(decodeURIComponent(atob(raw))) : null;
		} catch {
			cartData = null;
		}
	}

	async function pay() {
		busy = true;
		errorMsg = '';
		try {
			const res = await fetch('/shop/api/mock-pay', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					session_id: sessionId,
					items: cartData.items.map((i) => ({ product_id: i.product_id, qty: i.qty })),
					customer
				})
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data?.message ?? '決済に失敗しました');
			clearCart();
			location.href = `/shop/thanks?session_id=${data.session_id}`;
		} catch (e) {
			errorMsg = e.message;
			busy = false;
		}
	}
</script>

<svelte:head><title>お支払い（テストモード）</title></svelte:head>

<div class="ii-page mock">
	<main class="box">
		<p class="ii-label badge" lang="ja">テストモード — Stripe接続後は本物の決済画面になります</p>

		{#if !cartData}
			<p class="ii-jp empty" lang="ja">
				バッグの情報が見つかりません。<a href="/shop">Shopへ戻る</a>
			</p>
		{:else}
			<h1 class="ii-display" lang="ja">お支払い</h1>

			<ul class="items">
				{#each cartData.items as i}
					<li>
						<span class="ii-jp" lang="ja">{i.name} × {i.qty}</span>
						<span class="ii-body">{yen(i.price * i.qty)}</span>
					</li>
				{/each}
				<li>
					<span class="ii-jp" lang="ja">送料</span>
					{#if cartData.shipping === 0}
						<span class="ii-jp" lang="ja">無料</span>
					{:else}
						<span class="ii-body">{yen(cartData.shipping)}</span>
					{/if}
				</li>
				<li class="total">
					<span class="ii-jp" lang="ja">合計（税込）</span>
					<span class="ii-body">{yen(cartData.subtotal + cartData.shipping)}</span>
				</li>
			</ul>

			<div class="form">
				<label class="ii-field">
					<span class="ii-label" lang="ja">お名前</span>
					<input bind:value={customer.name} />
				</label>

				<label class="ii-field">
					<span class="ii-label" lang="ja">メール</span>
					<input bind:value={customer.email} />
				</label>

				<label class="ii-field">
					<span class="ii-label" lang="ja">電話番号</span>
					<input bind:value={customer.phone} />
				</label>

				<div class="row">
					<label class="ii-field">
						<span class="ii-label" lang="ja">郵便番号</span>
						<input bind:value={customer.zip} />
					</label>
					<label class="ii-field">
						<span class="ii-label" lang="ja">都道府県</span>
						<input bind:value={customer.state} />
					</label>
				</div>

				<label class="ii-field">
					<span class="ii-label" lang="ja">市区町村</span>
					<input bind:value={customer.city} />
				</label>

				<label class="ii-field">
					<span class="ii-label" lang="ja">番地・建物</span>
					<input bind:value={customer.line1} />
				</label>

				<label class="ii-field">
					<span class="ii-label" lang="ja">配送時間帯</span>
					<select class="ii-caret" bind:value={customer.timeslot} lang="ja">
						{#each TIME_SLOTS as t}<option value={t.value}>{t.label}</option>{/each}
					</select>
				</label>

				<label class="check ii-jp" lang="ja">
					<input type="checkbox" bind:checked={customer.gift} />
					ギフト包装を希望
				</label>

				<label class="ii-field">
					<span class="ii-label" lang="ja">備考（任意）</span>
					<input bind:value={customer.note} />
				</label>
			</div>

			{#if errorMsg}<p class="ii-body err" lang="ja">{errorMsg}</p>{/if}

			<button class="ii-btn pay" on:click={pay} disabled={busy} lang="ja">
				{busy ? '処理中…' : `${yen(cartData.subtotal + cartData.shipping)} を支払う（テスト）`}
			</button>
			<a class="ii-body cancel" href="/shop" lang="ja">キャンセルして戻る</a>
		{/if}
	</main>
</div>

<style>
	.mock {
		align-items: center;
		padding: 88px var(--ii-gutter) 96px;
	}
	.box {
		width: min(420px, 100%);
	}

	/* the one piece of alarm the page is allowed */
	.badge {
		padding-bottom: 14px;
		border-bottom: 1px solid var(--ii-rule-soft);
		color: var(--ii-alert);
	}
	.empty {
		margin-top: 40px;
	}
	.empty a {
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	h1 {
		margin-top: 44px;
	}

	.items {
		margin-top: 40px;
		border-top: 1px solid var(--ii-rule);
	}
	.items li {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 16px;
		padding: 13px 0;
		border-bottom: 1px solid var(--ii-rule-soft);
	}
	.items .total {
		border-bottom-color: var(--ii-rule);
	}

	.form {
		display: flex;
		flex-direction: column;
		gap: 26px;
		margin-top: 44px;
	}
	.row {
		display: flex;
		gap: 20px;
	}
	.row label {
		flex: 1;
	}

	/* `.ii select { background: transparent }` in ii.css is (0,1,1) and
	   outranks `.ii-caret` (0,1,0), whose whole declaration is background
	   shorthand, so the arrow has to be re-asserted at page level. Same story
	   for `.ii button` under `.ii-btn`, below. */
	select.ii-caret {
		background-image: linear-gradient(45deg, transparent 50%, var(--ii-mute) 50%),
			linear-gradient(135deg, var(--ii-mute) 50%, transparent 50%);
		background-position: right 5px top 1.05em, right 1px top 1.05em;
		background-size: 4px 4px, 4px 4px;
		background-repeat: no-repeat;
		padding-right: 16px;
	}

	.check {
		display: flex;
		align-items: center;
		gap: 10px;
	}
	/* the native box is erased by `.ii input { appearance: none }`, so it is
	   redrawn as a hairline square that fills when checked */
	.check input[type='checkbox'] {
		flex: none;
		width: 13px;
		height: 13px;
		border: 1px solid var(--ii-rule);
		cursor: pointer;
		transition: background 0.5s ease, border-color 0.5s ease;
	}
	.check input[type='checkbox']:checked {
		background: var(--ii-ink);
		border-color: var(--ii-ink);
	}

	.err {
		margin-top: 20px;
		color: var(--ii-alert);
	}

	.pay.ii-btn {
		margin-top: 44px;
		border: 1px solid var(--ii-ink);
		font-size: 11px;
		line-height: 1.8;
	}
	.cancel {
		display: block;
		margin-top: 20px;
		text-align: center;
		color: var(--ii-mute);
	}

	@media screen and (min-width: 720px) {
		.mock {
			padding: 14vh var(--ii-gutter) 120px;
		}
		.box {
			width: min(460px, 100%);
		}
	}
</style>
