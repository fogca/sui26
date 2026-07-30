<script>
	import { cart, cartOpen, setQty, clearCart } from '$lib/shop/cart.js';
	import { yen } from '$lib/shop/money.js';

	// settings passed from the page (shipping fee / free threshold)
	export let settings = { shipping_fee: 800, free_over: 11000 };

	let catalog = null; // id -> product
	let busy = false;
	let errorMsg = '';

	$: if ($cartOpen && !catalog) loadCatalog();

	async function loadCatalog() {
		const res = await fetch('/shop/api/catalog');
		const list = await res.json();
		catalog = Object.fromEntries(list.map((p) => [p.id, p]));
	}

	$: lines = catalog
		? $cart
				.map((i) => ({ ...i, product: catalog[i.id] }))
				.filter((l) => l.product)
		: [];
	$: subtotal = lines.reduce((s, l) => s + l.product.price * l.qty, 0);
	$: shipping = subtotal === 0 ? 0 : subtotal >= settings.free_over ? 0 : settings.shipping_fee;
	$: remainForFree = settings.free_over - subtotal;

	async function checkout() {
		busy = true;
		errorMsg = '';
		try {
			const res = await fetch('/shop/api/checkout', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ items: $cart.map((i) => ({ id: i.id, qty: i.qty })) })
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data?.message ?? 'エラーが発生しました');
			location.href = data.url;
		} catch (e) {
			errorMsg = e.message;
			busy = false;
		}
	}
</script>

{#if $cartOpen}
	<button class="scrim" aria-label="閉じる" on:click={() => cartOpen.set(false)}></button>
	<aside class="drawer">
		<div class="head">
			<h2 class="serif">Cart</h2>
			<button class="close" on:click={() => cartOpen.set(false)}>×</button>
		</div>

		{#if !catalog}
			<p class="empty">読み込み中…</p>
		{:else if lines.length === 0}
			<p class="empty">カートは空です。</p>
		{:else}
			<ul class="lines">
				{#each lines as line (line.id)}
					<li>
						{#if line.product.image}
							<img src={line.product.image} alt="" />
						{/if}
						<div class="info">
							<span class="name">{line.product.name}</span>
							{#if line.product.spec}<span class="spec">{line.product.spec}</span>{/if}
							<span class="price">{yen(line.product.price)}</span>
							<div class="qty">
								<button on:click={() => setQty(line.id, line.qty - 1)}>−</button>
								<span>{line.qty}</span>
								<button
									on:click={() => setQty(line.id, line.qty + 1)}
									disabled={line.qty >= Math.min(9, line.product.stock)}>＋</button>
								<button class="rm" on:click={() => setQty(line.id, 0)}>削除</button>
							</div>
						</div>
					</li>
				{/each}
			</ul>

			<div class="totals">
				<div><span>小計</span><span>{yen(subtotal)}</span></div>
				<div>
					<span>送料</span>
					<span>{shipping === 0 ? '無料' : yen(shipping)}</span>
				</div>
				{#if shipping > 0 && remainForFree > 0}
					<p class="free-note">あと{yen(remainForFree)}で送料無料</p>
				{/if}
				<div class="grand"><span>合計（税込）</span><span>{yen(subtotal + shipping)}</span></div>
			</div>

			{#if errorMsg}<p class="err">{errorMsg}</p>{/if}

			<button class="checkout" on:click={checkout} disabled={busy}>
				{busy ? 'お手続きへ…' : 'ご購入手続きへ'}
			</button>
			<p class="pay-note">カード / Apple Pay / コンビニ払い / PayPay</p>
		{/if}
	</aside>
{/if}

<style>
	.scrim {
		position: fixed;
		inset: 0;
		background: rgba(18, 18, 18, 0.25);
		z-index: 90;
		border: none;
		cursor: default;
	}
	.drawer {
		position: fixed;
		top: 0;
		right: 0;
		height: 100dvh;
		width: min(40rem, 92vw);
		background: var(--backgroundColor);
		z-index: 91;
		padding: 2.4rem 2rem calc(2.4rem + env(safe-area-inset-bottom));
		display: flex;
		flex-direction: column;
		overflow-y: auto;
		box-shadow: -12px 0 40px rgba(0, 0, 0, 0.08);
	}
	.head {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		margin-bottom: 2rem;
	}
	.head h2 {
		font-size: 1.8rem;
		letter-spacing: 0.05em;
	}
	.close {
		font-size: 1.8rem;
		color: var(--subColor);
		cursor: pointer;
	}
	.empty {
		color: var(--subColor);
	}
	.lines {
		display: flex;
		flex-direction: column;
		gap: 1.6rem;
		flex: 1;
	}
	.lines li {
		display: flex;
		gap: 1.2rem;
	}
	.lines img {
		width: 7.2rem;
		height: 9rem;
		object-fit: cover;
		flex: 0 0 auto;
	}
	.info {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}
	.name {
		font-size: 1.25rem;
	}
	.spec {
		font-size: 1rem;
		color: var(--subColor);
	}
	.price {
		font-size: 1.15rem;
	}
	.qty {
		display: flex;
		align-items: center;
		gap: 0.8rem;
		margin-top: 0.4rem;
	}
	.qty button {
		width: 2.4rem;
		height: 2.4rem;
		border: 1px solid #ddd;
		border-radius: 50%;
		cursor: pointer;
		color: var(--textColor);
	}
	.qty button:disabled {
		opacity: 0.3;
	}
	.qty .rm {
		border: none;
		width: auto;
		font-size: 1rem;
		color: var(--subColor);
	}
	.totals {
		margin-top: 2.4rem;
		border-top: 1px solid #e5e3e0;
		padding-top: 1.6rem;
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}
	.totals > div {
		display: flex;
		justify-content: space-between;
		font-size: 1.2rem;
	}
	.free-note {
		font-size: 1.05rem;
		color: var(--subColor);
		text-align: right;
	}
	.grand {
		font-size: 1.35rem;
		margin-top: 0.4rem;
	}
	.err {
		color: #c0392b;
		font-size: 1.1rem;
		margin-top: 1rem;
	}
	.checkout {
		margin-top: 1.6rem;
		background: var(--blackColor);
		color: #fff;
		padding: 1.2rem;
		font-size: 1.25rem;
		letter-spacing: 0.05em;
		cursor: pointer;
		border-radius: 2px;
	}
	.checkout:disabled {
		opacity: 0.5;
	}
	.pay-note {
		margin-top: 0.8rem;
		font-size: 0.95rem;
		color: var(--subColor);
		text-align: center;
	}
</style>
