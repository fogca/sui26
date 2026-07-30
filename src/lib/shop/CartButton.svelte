<script>
	import { cart, cartOpen } from '$lib/shop/cart.js';
	$: count = $cart.reduce((s, i) => s + i.qty, 0);
</script>

<button class="cart-btn serif" on:click={() => cartOpen.set(true)} aria-label="カートを開く">
	Cart{#if count > 0}<span class="count">{count}</span>{/if}
</button>

<style>
	.cart-btn {
		/* bottom-right: top-right is owned by the site Menu (Header.svelte) */
		position: fixed;
		bottom: calc(2rem + env(safe-area-inset-bottom));
		right: var(--padding);
		z-index: 40;
		font-size: 1.15rem;
		letter-spacing: 0.05em;
		color: var(--textColor);
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.count {
		min-width: 1.8rem;
		height: 1.8rem;
		border-radius: 50%;
		background: var(--blackColor);
		color: #fff;
		font-size: 0.95rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	@media screen and (min-width: 720px) {
		.cart-btn {
			bottom: 3.5rem;
			right: var(--pcPadding);
		}
	}
</style>
