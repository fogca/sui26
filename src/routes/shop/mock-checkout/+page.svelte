<script>
	// Local stand-in for the Stripe hosted checkout page (mock mode only).
	// Exercises the same fulfillment path via /shop/api/mock-pay.
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

<section class="mock">
	<div class="box">
		<p class="badge">テストモード — Stripe接続後は本物の決済画面になります</p>

		{#if !cartData}
			<p>カート情報が見つかりません。<a href="/shop">Shopへ戻る</a></p>
		{:else}
			<h1 class="serif">お支払い</h1>

			<ul class="items">
				{#each cartData.items as i}
					<li><span>{i.name} × {i.qty}</span><span>{yen(i.price * i.qty)}</span></li>
				{/each}
				<li><span>送料</span><span>{cartData.shipping === 0 ? '無料' : yen(cartData.shipping)}</span></li>
				<li class="total"><span>合計（税込）</span><span>{yen(cartData.subtotal + cartData.shipping)}</span></li>
			</ul>

			<div class="form">
				<label><span>お名前</span><input bind:value={customer.name} /></label>
				<label><span>メール</span><input bind:value={customer.email} /></label>
				<label><span>電話番号</span><input bind:value={customer.phone} /></label>
				<div class="row">
					<label><span>郵便番号</span><input bind:value={customer.zip} /></label>
					<label><span>都道府県</span><input bind:value={customer.state} /></label>
				</div>
				<label><span>市区町村</span><input bind:value={customer.city} /></label>
				<label><span>番地・建物</span><input bind:value={customer.line1} /></label>
				<label><span>配送時間帯</span>
					<select bind:value={customer.timeslot}>
						{#each TIME_SLOTS as t}<option value={t.value}>{t.label}</option>{/each}
					</select>
				</label>
				<label class="check"><input type="checkbox" bind:checked={customer.gift} /> ギフト包装を希望</label>
				<label><span>備考（任意）</span><input bind:value={customer.note} /></label>
			</div>

			{#if errorMsg}<p class="err">{errorMsg}</p>{/if}

			<button class="pay" on:click={pay} disabled={busy}>
				{busy ? '処理中…' : `${yen(cartData.subtotal + cartData.shipping)} を支払う（テスト）`}
			</button>
			<a class="cancel" href="/shop">キャンセルして戻る</a>
		{/if}
	</div>
</section>

<style>
	.mock {
		min-height: 100vh;
		min-height: 100dvh;
		display: flex;
		justify-content: center;
		padding: 6rem var(--padding) 8rem;
	}
	.box {
		width: min(46rem, 100%);
	}
	.badge {
		font-size: 1rem;
		color: #9a6b2f;
		background: #f6ead9;
		padding: 0.6rem 1rem;
		border-radius: 3px;
		margin-bottom: 2.4rem;
	}
	h1 {
		font-size: 1.8rem;
		letter-spacing: 0.05em;
		margin-bottom: 2rem;
	}
	.items {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		border-bottom: 1px solid #e5e3e0;
		padding-bottom: 1.6rem;
		margin-bottom: 2.4rem;
	}
	.items li {
		display: flex;
		justify-content: space-between;
		font-size: 1.2rem;
	}
	.items .total {
		font-size: 1.35rem;
		margin-top: 0.6rem;
	}
	.form {
		display: flex;
		flex-direction: column;
		gap: 1.4rem;
	}
	label {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}
	label span {
		font-size: 1rem;
		color: var(--subColor);
	}
	input,
	select {
		border: 1px solid #ddd;
		padding: 0.8rem;
		font-size: 1.2rem;
		background: #fff;
		border-radius: 2px;
	}
	.row {
		display: flex;
		gap: 1.2rem;
	}
	.row label {
		flex: 1;
	}
	.check {
		flex-direction: row;
		align-items: center;
		gap: 0.8rem;
		font-size: 1.15rem;
	}
	.check input {
		width: 1.6rem;
		height: 1.6rem;
	}
	.err {
		color: #c0392b;
		margin-top: 1.2rem;
	}
	.pay {
		margin-top: 2.4rem;
		width: 100%;
		background: var(--blackColor);
		color: #fff;
		padding: 1.3rem;
		font-size: 1.25rem;
		cursor: pointer;
		border-radius: 3px;
	}
	.pay:disabled {
		opacity: 0.5;
	}
	.cancel {
		display: block;
		text-align: center;
		margin-top: 1.6rem;
		color: var(--subColor);
		font-size: 1.1rem;
	}
</style>
