<script>
	import { onMount, onDestroy } from 'svelte';
	import { cart, cartOpen, cartDrawerMounted, setQty, clearCart } from '$lib/shop/cart.js';
	import { yen } from '$lib/shop/money.js';
	import { page } from '$app/stores';
	import { translator } from '$lib/i18n.js';

	// settings passed from the page (shipping fee / free threshold)
	export let settings = { shipping_fee: 800, free_over: 11000 };

	$: lang = $page.data?.lang ?? 'ja';
	$: t = translator(lang);

	let catalog = null; // id -> product
	let busy = false;
	let errorMsg = '';

	// The site chrome's cart control opens this drawer where one is mounted and
	// otherwise sends the reader to the shop. This is the flag it reads.
	onMount(() => cartDrawerMounted.set(true));
	onDestroy(() => cartDrawerMounted.set(false));

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
			if (!res.ok) throw new Error(data?.message ?? t('shop.error'));
			location.href = data.url;
		} catch (e) {
			errorMsg = e.message;
			busy = false;
		}
	}
</script>

{#if $cartOpen}
	<button class="scrim" aria-label={t('shop.closeCart')} on:click={() => cartOpen.set(false)}></button>
	<!-- The page language is already declared on <html>. Repeating it on the
	     drawer would make `.ii [lang="ja"] *` (0,2,0) sweep the English mark and
	     every price into the Japanese gothic, so each run carries its own. -->
	<aside class="drawer">
		<div class="head">
			<!-- "Cart" is English-only in both languages -->
			<h2 class="title" lang="en">{t('common.cart')}</h2>
			<!-- the cross is drawn, not set: Ango has no × and would fall back -->
			<button class="close" aria-label={t('shop.closeCart')} on:click={() => cartOpen.set(false)}></button>
		</div>

		{#if !catalog}
			<p class="state ii-body" lang={lang}>{t('common.loading')}</p>
		{:else if lines.length === 0}
			<p class="state ii-body" lang={lang}>{t('shop.cartEmpty')}</p>
		{:else}
			<ul class="lines">
				{#each lines as line (line.id)}
					<li>
						{#if line.product.image}
							<img src={line.product.image} alt="" />
						{/if}
						<div class="info">
							<!-- product copy is Japanese-only database content -->
							<span class="name ii-jp" lang="ja">{line.product.name}</span>
							{#if line.product.spec}<span class="spec ii-label" lang="ja">{line.product.spec}</span>{/if}
							<span class="price ii-body">{yen(line.product.price)}</span>
							<div class="qty">
								<div class="stepper">
									<button
										class="step minus"
										aria-label={t('shop.qtyMinus')}
										on:click={() => setQty(line.id, line.qty - 1)}></button>
									<span class="n">{line.qty}</span>
									<button
										class="step plus"
										aria-label={t('shop.qtyPlus')}
										on:click={() => setQty(line.id, line.qty + 1)}
										disabled={line.qty >= Math.min(9, line.product.stock)}></button>
								</div>
								<button class="rm" lang={lang} on:click={() => setQty(line.id, 0)}
									>{t('shop.remove')}</button>
							</div>
						</div>
					</li>
				{/each}
			</ul>

			<div class="totals">
				<div class="row">
					<span class="lbl ii-body" lang={lang}>{t('shop.subtotal')}</span>
					<span class="ii-body">{yen(subtotal)}</span>
				</div>
				<div class="row">
					<span class="lbl ii-body" lang={lang}>{t('shop.shipping')}</span>
					<!-- either a word, which has a language, or an amount, which does
					     not and should keep Ango's figures -->
					<span class="ii-body" lang={shipping === 0 ? lang : null}
						>{shipping === 0 ? t('shop.shippingFree') : yen(shipping)}</span>
				</div>
				{#if shipping > 0 && remainForFree > 0}
					<p class="free-note" lang={lang}>{t('shop.freeShipRemain', { amount: yen(remainForFree) })}</p>
				{/if}
				<div class="row grand">
					<span class="lbl ii-body" lang={lang}>{t('shop.totalWithTax')}</span>
					<span class="ii-body">{yen(subtotal + shipping)}</span>
				</div>
			</div>

			{#if errorMsg}<p class="err ii-body" lang={lang}>{errorMsg}</p>{/if}

			<button class="ii-btn ii-btn-fill checkout" lang={lang} on:click={checkout} disabled={busy}>
				{busy ? t('shop.checkoutBusy') : t('shop.checkout')}
			</button>
			<p class="pay-note" lang={lang}>{t('shop.payNote')}</p>
		{/if}
	</aside>
{/if}

<style>
	.scrim {
		position: fixed;
		inset: 0;
		z-index: 90;
		background: rgba(47, 61, 71, 0.22);
		cursor: default;
	}
	.drawer {
		position: fixed;
		top: 0;
		right: 0;
		z-index: 91;
		height: 100vh;
		height: 100dvh;
		width: min(420px, 92vw);
		/* a fixed overlay cannot borrow the page's white, and the direction has
		   no shadows — the edge is a hairline */
		background: var(--ii-bg, #fff);
		border-left: 1px solid var(--ii-rule);
		color: var(--ii-ink);
		padding: 26px 21px calc(26px + env(safe-area-inset-bottom));
		display: flex;
		flex-direction: column;
		overflow-y: auto;
	}

	.head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 16px;
		margin-bottom: 26px;
	}
	.title {
		font-size: 20px;
		font-weight: var(--ii-thin);
		line-height: 1.2;
	}
	.close {
		position: relative;
		flex: 0 0 auto;
		width: 18px;
		height: 18px;
		color: var(--ii-mute);
		cursor: pointer;
		transition: color 0.5s ease;
	}
	.close:hover {
		color: var(--ii-ink);
	}
	.close::before,
	.close::after {
		content: '';
		position: absolute;
		left: 50%;
		top: 50%;
		width: 15px;
		height: 1px;
		background: currentColor;
	}
	.close::before {
		transform: translate(-50%, -50%) rotate(45deg);
	}
	.close::after {
		transform: translate(-50%, -50%) rotate(-45deg);
	}

	.state {
		margin-top: 30px;
		color: var(--ii-mute);
	}

	.lines {
		flex: 1;
		border-top: 1px solid var(--ii-rule);
	}
	.lines li {
		display: flex;
		gap: 14px;
		padding: 18px 0;
		border-bottom: 1px solid var(--ii-rule-soft);
	}
	.lines img {
		flex: 0 0 auto;
		width: 72px;
		height: 90px;
		object-fit: cover;
	}
	.info {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
	}
	.name {
		display: block;
	}
	.spec {
		display: block;
		margin-top: 4px;
	}
	.price {
		display: block;
		margin-top: 8px;
	}

	.qty {
		display: flex;
		align-items: center;
		gap: 14px;
		margin-top: 12px;
	}
	/* the steppers are drawn rather than set: Ango has neither − nor ＋, and a
	   filled circle is not this direction's shape */
	.stepper {
		display: inline-flex;
		align-items: stretch;
		border: 1px solid var(--ii-rule);
	}
	.step {
		position: relative;
		width: 26px;
		height: 26px;
		cursor: pointer;
		transition: opacity 0.5s ease;
	}
	.step::before,
	.step::after {
		content: '';
		position: absolute;
		left: 50%;
		top: 50%;
		width: 9px;
		height: 1px;
		background: currentColor;
		transform: translate(-50%, -50%);
	}
	.minus::after {
		content: none;
	}
	.plus::after {
		transform: translate(-50%, -50%) rotate(90deg);
	}
	.step:disabled {
		opacity: 0.28;
		cursor: default;
	}
	.n {
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 26px;
		font-size: 12px;
	}
	.rm {
		font-size: 11px;
		line-height: 1.2;
		color: var(--ii-mute);
		cursor: pointer;
		transition: opacity 0.5s ease;
	}
	.rm:hover {
		opacity: 0.55;
	}

	.totals {
		margin-top: 30px;
		display: flex;
		flex-direction: column;
		gap: 9px;
	}
	.row {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 16px;
	}
	.lbl {
		color: var(--ii-mute);
	}
	.free-note {
		margin-top: 2px;
		font-size: 11px;
		line-height: 1.6;
		color: var(--ii-mute);
		text-align: right;
	}
	.grand {
		margin-top: 13px;
		padding-top: 16px;
		border-top: 1px solid var(--ii-rule);
		color: var(--ii-ink-deep);
	}
	.grand .lbl {
		color: var(--ii-ink-deep);
	}

	.err {
		margin-top: 14px;
		color: var(--ii-alert);
	}

	/* .ii-btn draws the hairline box, but `.ii button` is (0,1,1) and strips the
	   border and the 11px back off a <button>; re-assert them here, where the
	   Svelte hash wins. */
	.checkout {
		margin-top: 22px;
		border: 1px solid var(--ii-ink);
		font-size: 11px;
		line-height: 1.8;
	}
	.pay-note {
		margin-top: 12px;
		font-size: 11px;
		line-height: 1.6;
		color: var(--ii-mute);
		text-align: center;
	}

	@media screen and (min-width: 720px) {
		.drawer {
			width: min(460px, 92vw);
			padding: 34px 30px calc(34px + env(safe-area-inset-bottom));
		}
		.head {
			margin-bottom: 34px;
		}
		.title {
			font-size: 24px;
		}
		.lines img {
			width: 84px;
			height: 105px;
		}
		.n {
			font-size: 13px;
		}
		.free-note,
		.pay-note,
		.rm {
			font-size: 12px;
		}
	}
</style>
