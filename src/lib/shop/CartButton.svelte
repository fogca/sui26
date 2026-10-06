<script>
	import { cart, cartOpen } from '$lib/shop/cart.js';
	import { page } from '$app/stores';
	import { translator } from '$lib/i18n.js';
	$: count = $cart.reduce((s, i) => s + i.qty, 0);
	$: t = translator($page.data?.lang ?? 'ja');
</script>

<!-- "Cart" is English-only in both languages, so it carries lang="en" -->
<button class="cart-btn" lang="en" on:click={() => cartOpen.set(true)} aria-label={t('shop.openCart')}>
	<span class="word">{t('common.cart')}</span>{#if count > 0}<span class="count">{count}</span>{/if}
</button>

<style>
	/* bottom-right: the top-right corner belongs to the site chrome. A hairline
	   box on white, because the control floats over the page's own copy.
	   The size is set here rather than by .ii-body: `.ii button` is (0,1,1) and
	   would outrank a bare utility class. */
	.cart-btn {
		position: fixed;
		bottom: calc(20px + env(safe-area-inset-bottom));
		right: var(--ii-gutter);
		z-index: 40;
		display: flex;
		align-items: baseline;
		gap: 9px;
		padding: 11px 15px;
		border: 1px solid var(--ii-rule);
		background: var(--ii-bg, #fff);
		color: var(--ii-ink);
		font-size: 12px;
		line-height: 1.2;
		cursor: pointer;
		transition: background 0.6s ease, color 0.6s ease, border-color 0.6s ease;
	}
	.cart-btn:hover {
		background: var(--ii-ink);
		color: #fff;
		border-color: var(--ii-ink);
	}
	/* a plain number set beside the word — this direction has no filled shapes */
	.count {
		font-size: 10px;
	}

	@media screen and (min-width: 720px) {
		.cart-btn {
			bottom: 32px;
			padding: 12px 17px;
			font-size: 13px;
		}
		.count {
			font-size: 11px;
		}
	}
</style>
