<script>
	// Site chrome, from the Figma frames 128:264 and 128:284 — which now carry
	// the same arrangement on every page: wordmark and tagline at the top left,
	// section nav and cart at the top right, all in white over the field.
	//
	// Measurements are the frames' own, in px at the 393pt artboard:
	//   wordmark  left 24, top 23, 67 wide
	//   tagline   centred on x 57, top 65, 6.4px
	//   nav       left 202, top 22, 12px, tracking 0.03em
	//   cart      left 360, top 21, 16 wide
	//
	// The frames draw three links. Contact and the language switch are kept —
	// the site has a working /contact and two languages, and dropping either
	// from the only navigation on the page would break it.
	import { page } from '$app/stores';
	import { cart, cartOpen, cartDrawerMounted } from '$lib/shop/cart.js';
	import { localizePath, splitLang, translator } from '$lib/i18n.js';
	import { goto } from '$app/navigation';

	/** 'over' — white, on the field. 'ink' — for any surface that stays white. */
	export let tone = 'over';

	$: pale = tone === 'over';
	$: wordmark = pale ? '/ii/wordmark-white.svg' : '/ii/wordmark-ink.svg';

	$: lang = $page.data?.lang ?? 'ja';
	$: t = translator(lang);
	$: path = (p) => localizePath(p, lang);
	$: home = path('/');
	$: otherLangHref = localizePath(
		splitLang($page.url.pathname).path,
		lang === 'ja' ? 'en' : 'ja'
	);

	$: links = [
		{ label: t('nav.fragrance'), href: path('/shop') },
		{ label: t('nav.works'), href: path('/works') },
		{ label: t('nav.about'), href: path('/about') },
		{ label: t('nav.contact'), href: path('/contact') }
	];

	$: count = $cart.reduce((s, i) => s + i.qty, 0);

	/** Remember the pick for this tab session, so the pre-paint script in
	 *  app.html doesn't send the reader back to the other language on the next
	 *  visit to the bare entry point. */
	function rememberLang() {
		try {
			sessionStorage.setItem('sui-lang', lang === 'ja' ? 'en' : 'ja');
		} catch (e) {
			// private mode / storage disabled — the URL still carries the language
		}
	}

	/** Open the drawer where one is mounted; otherwise take the reader to the
	 *  shop, which is where the drawer lives. */
	function openCart() {
		if ($cartDrawerMounted) cartOpen.set(true);
		else goto(path('/shop'));
	}
</script>

<header class="chrome" class:ink={!pale}>
	<a class="brand" href={home}>
		<img class="wordmark" src={wordmark} alt="SUI" width="67" height="34" />
		<span class="ii-micro tag" lang="en">
			Weaving the resonance<br />that scents all creation.
		</span>
	</a>

	<nav class="nav" lang="en">
		{#each links as l}
			<a class="ii-body" class:current={$page.url.pathname === l.href} href={l.href}>{l.label}</a>
		{/each}
		<a
			class="ii-body lang"
			href={otherLangHref}
			hreflang={lang === 'ja' ? 'en' : 'ja'}
			on:click={rememberLang}>{lang === 'ja' ? 'EN' : 'JA'}</a
		>
		<button class="cart" type="button" on:click={openCart} aria-label={t('shop.openCart')}>
			<img src="/ii/cart.svg" alt="" width="16" height="15" class:inked={!pale} />
			{#if count > 0}<span class="ii-micro count">{count}</span>{/if}
		</button>
	</nav>
</header>

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
	}
	.chrome.ink {
		color: var(--ii-ink);
	}

	.brand {
		display: block;
		margin-top: 2px;
		text-align: center;
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
	.lang {
		opacity: 0.7;
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
	.cart img {
		width: 16px;
		height: auto;
	}
	/* the cart glyph ships white; on a white surface it has to read as ink */
	.cart img.inked {
		filter: brightness(0) saturate(100%) invert(39%) sepia(13%) saturate(730%)
			hue-rotate(158deg) brightness(93%) contrast(88%);
	}
	.count {
		font-size: 9px;
	}

	@media screen and (min-width: 720px) {
		.chrome {
			padding: 30px 3.4vw 0 4.4vw;
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
		.cart img {
			width: 18px;
		}
	}
</style>
