<script>
	import { contactHref } from '$lib/works.js';
</script>

<nav class="site-menu">
	<a href="/shop">Fragrance</a>
	<a href="/works">Works</a>
	<a href="/about">About</a>
	<a href={contactHref} target="_blank">Contact</a>
</nav>

<style>
	.site-menu {
		position: fixed;
		top: calc(2.5rem + env(safe-area-inset-top));
		right: var(--padding);
		z-index: 20;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.6rem;
	}
	.site-menu a {
		font-size: 1.1rem;
		letter-spacing: 0.05em;
		color: var(--textColor);
	}

	@media screen and (min-width: 720px) {
		.site-menu {
			top: 4rem;
			right: var(--pcPadding);
			flex-direction: row;
			gap: 2.2rem;
		}
	}
</style>
