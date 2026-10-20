<script>
	// Site chrome, from the Figma frames 128:264 and 128:284 — which now carry
	// the same arrangement on every page: wordmark and tagline at the top left,
	// section nav and cart at the top right, all in white over the field.
	//
	// Measurements are the frames' own, in px at the 393pt artboard:
	//   wordmark  left 24, top 23, 67 wide
	//   tagline   centred on x 57, top 65, 6.4px — the frames set this to
	//             "Weaving the resonance / that scents all creation."; the
	//             studio's line replaced it
	//   nav       left 202, top 22, 12px, tracking 0.03em
	//   cart      left 360, top 21, 16 wide
	//
	// The three links the frames draw, and nothing else. Contact sits in the
	// footer. There is no language switch either — every page carries English
	// and Japanese together, so there is nothing to switch between.
	import { page } from '$app/stores';
	import { cart, cartOpen, cartDrawerMounted } from '$lib/shop/cart.js';
	import {translator} from '$lib/i18n.js';
	import { goto } from '$app/navigation';
	import { onDestroy } from 'svelte';

	/** 'over' — white, on the field. 'ink' — for any surface that stays white. */
	export let tone = 'over';
	/** The wordmark takes its own tone where the two halves of the screen do not
	 *  match — the product page fixes photography under the left half, so the
	 *  mark sits on a shot while the nav sits on the pale surface. Defaults to
	 *  the header's own tone. */
	export let brandTone = null;

	$: pale = tone === 'over';
	$: brandPale = (brandTone ?? tone) === 'over';
	$: wordmark = brandPale ? '/ii/wordmark-white.svg' : '/ii/wordmark-ink.svg';

	$: lang = $page.data?.lang ?? 'ja';
	$: t = translator(lang);
	$: home = '/';

	$: links = [
		{ label: t('nav.fragrance'), href: '/shop' },
		{ label: t('nav.works'), href: '/works' },
		{ label: t('nav.about'), href: '/about' }
	];

	$: count = $cart.reduce((s, i) => s + i.qty, 0);

	/** Open the drawer where one is mounted; otherwise take the reader to the
	 *  shop, which is where the drawer lives. */
	function openCart() {
		if ($cartDrawerMounted) cartOpen.set(true);
		else goto('/shop');
	}

	// ─── the menu ──────────────────────────────────────────────────────
	// Three links and a bag fit across a phone, but only barely — 178px of a
	// 375 screen at 11px. On a phone they fold into one word instead, and the
	// panel that opens is where Contact lives too: the foot is the only other
	// place it appears, and Top and Works have no foot.
	let menuOpen = false;

	$: menuLinks = [...links, { label: t('nav.contact'), href: '/contact' }];

	function openMenu() {
		menuOpen = true;
		document.body.style.overflow = 'hidden';
	}
	function closeMenu() {
		menuOpen = false;
		document.body.style.overflow = '';
	}
	function onKey(e) {
		if (e.key === 'Escape' && menuOpen) closeMenu();
	}

	onDestroy(() => {
		if (typeof document !== 'undefined') document.body.style.overflow = '';
	});
</script>

<header class="chrome" class:ink={!pale}>
	<a class="brand" class:pale={brandPale} href={home}>
		<img class="wordmark" src={wordmark} alt="SUI" width="67" height="34" />
		<span class="ii-micro tag" lang="en">
			Olfactory artwork /<br />Phenomenon
		</span>
	</a>

	<nav class="nav" lang="en">
		{#each links as l}
			<a
				class="ii-body wide"
				class:current={$page.url.pathname === l.href}
				href={l.href}>{l.label}</a
			>
		{/each}
		<button class="ii-body narrow" type="button" on:click={openMenu} lang="en">Menu</button>
		<button class="cart" type="button" on:click={openCart} aria-label={t('shop.openCart')}>
			<span class="glyph" aria-hidden="true"></span>
			{#if count > 0}<span class="ii-micro count">{count}</span>{/if}
		</button>
	</nav>
</header>

<svelte:window on:keydown={onKey} />

{#if menuOpen}
	<!-- above everything, including the opening and the page scrim -->
	<div class="menu on-field">
		<button class="ii-body close" type="button" on:click={closeMenu} lang="en">Close</button>
		<nav class="sheet" lang="en">
			{#each menuLinks as l}
				<a
					class="ii-display"
					class:current={$page.url.pathname === l.href}
					href={l.href}
					on:click={closeMenu}>{l.label}</a
				>
			{/each}
		</nav>
		<span class="ii-body sign" lang="en">scent studio</span>
	</div>
{/if}

<style>
	.chrome {
		/* fixed, not absolute: the redesign drops the footer nav, so this is the
		   only navigation on the page and it has to survive a scroll. It sits on
		   the same fixed plane as the surface, so nothing slides under it. */
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 10;
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		padding: calc(21px + env(safe-area-inset-top)) 17px 0 24px;
		color: #fff;
		/* a step above the page's 250 */
		font-weight: 350;
	}
	/* The runs inside carry .ii-body and .ii-micro, which ii.css gives an
	   explicit weight — a declaration on the element itself, which an inherited
	   value can never beat however specific the ancestor is. So they are named
	   here as well, and the header sets as one. */
	.chrome .tag,
	.chrome .nav a,
	.chrome .nav button,
	.chrome .count {
		font-weight: 350;
	}
	.chrome.ink {
		color: var(--ii-ink);
	}

	.brand {
		display: block;
		margin-top: 2px;
		text-align: center;
	}
	/* a rule on the element itself, so it wins over the colour .chrome.ink
	   hands down by inheritance */
	.brand.pale {
		color: #fff;
	}
	.wordmark {
		width: 67px;
		height: auto;
	}
	.tag {
		display: block;
		margin-top: 8px;
		white-space: nowrap;
	}

	.nav {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-top: 1px;
	}
	.current {
		opacity: 0.55;
	}

	.cart {
		margin-left: 12px;
		display: flex;
		align-items: center;
		gap: 4px;
		cursor: pointer;
	}
	/* The glyph takes its colour from the type around it. It used to be an
	   <img> recoloured by a hand-tuned filter chain, which was solved for one
	   particular ink and silently stopped matching the moment that token moved. */
	.cart .glyph {
		display: block;
		width: 16px;
		height: 15px;
		background: currentColor;
		-webkit-mask: url('/ii/cart.svg') no-repeat center / contain;
		mask: url('/ii/cart.svg') no-repeat center / contain;
	}
	.count {
		font-size: 9px;
	}

	/* one word on a phone, the three links on anything wider */
	.wide {
		display: none;
	}
	.narrow {
		cursor: pointer;
	}

	.menu {
		position: fixed;
		inset: 0;
		z-index: 60;
		display: flex;
		flex-direction: column;
		justify-content: center;
		/* .on-field turns --ii-ink white on this element, so the ground cannot
		   ask for it by name — ii.css's own value */
		background: #394750;
		padding: calc(21px + env(safe-area-inset-top)) 24px calc(24px + env(safe-area-inset-bottom));
	}
	.menu .close {
		position: absolute;
		top: calc(22px + env(safe-area-inset-top));
		right: 17px;
		cursor: pointer;
	}
	.sheet {
		display: flex;
		flex-direction: column;
		gap: 18px;
	}
	.sheet a.current {
		opacity: 0.55;
	}
	.menu .sign {
		position: absolute;
		left: 24px;
		bottom: calc(24px + env(safe-area-inset-bottom));
	}

	@media screen and (min-width: 720px) {
		.wide {
			display: inline;
		}
		.narrow {
			display: none;
		}
		.chrome {
			padding: 40px 50px;
		}
		.wordmark {
			width: 86px;
		}
		.nav {
			gap: 20px;
		}
		.cart {
			margin-left: 24px;
		}
		.cart .glyph {
			width: 18px;
			height: 17px;
		}
	}
</style>
