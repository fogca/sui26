<script>
	import { onMount } from 'svelte';
	// Product detail in the "II" direction. Every piece of commerce behaviour is
	// the one that was here before — gallery index, quantity bound to maxQty,
	// addToCart, the low-stock and sold-out branches, the shipping and payment
	// notes. Only the presentation changed.
	import Surface from '$lib/ii/Surface.svelte';
	import { BREATH } from '$lib/ii/surface.js';
	import Chrome from '$lib/ii/Chrome.svelte';
	import Foot from '$lib/ii/Foot.svelte';
	import CartDrawer from '$lib/shop/CartDrawer.svelte';
	import { addToCart } from '$lib/shop/cart.js';
	import { yen } from '$lib/shop/money.js';
	import { page } from '$app/stores';
	import { translator, localizePath, splitLang, both } from '$lib/i18n.js';
	export let data;

	const SITE = 'https://sui-sari.hi-843.workers.dev';

	$: p = data.product;
	let qty = 1;
	// which shot the strip has snapped to — for the counter under it
	let shot = 0;

	function onGalleryScroll(e) {
		const el = e.currentTarget;
		if (!el.clientWidth) return;
		shot = Math.round(el.scrollLeft / el.clientWidth);
	}

	// On a wide screen the strip becomes a half-screen panel that does not move;
	// the page's own scroll is what changes which shot is showing. The panel is
	// only built client side, so the phone layout is what the server renders and
	// what a crawler sees.
	let wide = false;
	// Where the panel is between its shots, as a fraction: 0 is the first, 1.5
	// is halfway between the second and the third. Neighbouring shots cross-fade
	// by that fraction.
	//
	// Scrolling sets where the panel is heading, not where it is. Tying the
	// fraction straight to the scroll offset made the shots snap past as fast as
	// the reader could flick — on a short product the whole set went by in one
	// gesture. The panel eases toward the target on its own clock instead, so it
	// always takes its time, however briskly the page is scrolled.
	let pos = 0;
	let target = 0;
	let raf = 0;
	let last = 0;

	/** Seconds for the dissolve to all but finish after the scroll settles. */
	const EASE = 0.6;

	function measure() {
		const span = document.documentElement.scrollHeight - window.innerHeight;
		const t = span > 0 ? Math.min(1, Math.max(0, window.scrollY / span)) : 0;
		return t * (p.images.length - 1);
	}

	/** Opacity of shot `i` with the panel at `at`.
	 *
	 *  The shot being left stays opaque and the next one fades in over it.
	 *  Fading both — one down, one up — leaves the pair covering only 75% at
	 *  the crossover, so the panel's own backing washed through the middle of
	 *  every change. Only the incoming shot carries the fade. */
	function fade(i, at) {
		const base = Math.floor(at);
		if (i <= base) return 1;
		if (i === base + 1) return at - base;
		return 0;
	}

	function tick(now) {
		const dt = Math.min(0.1, (now - last) / 1000);
		last = now;
		pos += (target - pos) * (1 - Math.exp(-dt / EASE));
		if (Math.abs(target - pos) > 0.002) {
			raf = requestAnimationFrame(tick);
		} else {
			pos = target;
			raf = 0;
		}
	}

	function onScroll() {
		if (!wide || p.images.length < 2) return;
		target = measure();
		if (!raf) {
			last = performance.now();
			raf = requestAnimationFrame(tick);
		}
	}

	onMount(() => {
		const mq = window.matchMedia('(min-width: 720px)');
		const sync = () => {
			wide = mq.matches;
			if (wide && p.images.length > 1) {
				// arrive already in place rather than easing in from the first shot
				target = measure();
				pos = target;
			}
			onScroll();
		};
		sync();
		mq.addEventListener('change', sync);
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => {
			mq.removeEventListener('change', sync);
			window.removeEventListener('scroll', onScroll);
			if (raf) cancelAnimationFrame(raf);
		};
	});
	$: maxQty = Math.min(9, p.stock);

	$: t = translator(data.lang);
	$: path = (q) => localizePath(q, data.lang);
	$: jaPath = splitLang($page.url.pathname).path;
	$: bag = both('shop.addToCart');
</script>

<svelte:head>
	<title>{p.name} — {t('common.siteName')}</title>
	<link rel="canonical" href="{SITE}{jaPath}" />
</svelte:head>

<CartDrawer settings={data.settings} />

<div class="ii-page">
	<Surface study={BREATH} opacity={0.5} />
	<!-- the mark is over the fixed shot once the panel is up, the nav is not -->
	<Chrome tone="ink" brandTone={wide ? 'over' : 'ink'} />

	<main class="ii-main product" style="--shots:{p.images.length}">
		{#if wide}
			<!-- half the screen, fixed, cross-fading as the page scrolls -->
			<div class="panel" aria-hidden="true">
				{#each p.images as img, i}
					<img
						class="pane"
						src={img}
						alt=""
						style="opacity:{fade(i, pos)}"
					/>
				{/each}
			</div>
		{/if}

		<!-- One strip of shots. On a phone it is the full width of the screen and
		     snaps one image at a time; on a wide screen the same strip simply
		     stacks, which is what the sticky information column is built for. -->
		<div class="gallery" on:scroll={onGalleryScroll}>
			{#each p.images as img, i}
				<figure class="shot">
					<img src={img} alt={i === 0 ? p.name : ''} loading={i === 0 ? 'eager' : 'lazy'} />
				</figure>
			{/each}
		</div>
		{#if p.images.length > 1}
			<p class="count ii-label" aria-hidden="true">
				{String(shot + 1).padStart(2, '0')} / {String(p.images.length).padStart(2, '0')}
			</p>
		{/if}

		<div class="info">
			<!-- name / spec / description are Japanese-only database copy -->
			<h1 class="ii-display title" lang="ja">{p.name}</h1>
			{#if p.spec}<p class="spec ii-label" lang="ja">{p.spec}</p>{/if}
			<p class="price ii-body">
				{yen(p.price)} <span class="tax ii-label" lang={data.lang}>{t('shop.taxIncluded')}</span>
			</p>

			<p class="desc ii-jp" lang="ja">{p.description}</p>

			{#if p.stock > 0}
				<div class="buy-row">
					<label class="ii-field qty">
						<span class="ii-label" lang={data.lang}>{t('shop.quantity')}</span>
						<select
							class="ii-caret"
							bind:value={qty}
							aria-label={t('shop.quantity')}
							lang={data.lang}
						>
							{#each Array.from({ length: maxQty }, (_, i) => i + 1) as n}
								<option value={n}>{n}</option>
							{/each}
						</select>
					</label>
					<button class="ii-btn ii-btn-fill add" on:click={() => addToCart(p.id, qty)}>
						<span lang="en">{bag.en}</span>
						<span class="ja" lang="ja">{bag.ja}</span>
					</button>
				</div>
				{#if p.stock <= 5}
					<p class="low-stock ii-body" lang={data.lang}>{t('shop.remaining', { n: p.stock })}</p>
				{/if}
			{:else}
				<span class="ii-btn ii-btn-fill is-out soldout" lang="en">{t('common.soldOut')}</span>
			{/if}

			<div class="notes" lang={data.lang}>
				<p class="ii-label">
					{t('shop.shippingNote', {
						fee: yen(data.settings.shipping_fee),
						free: yen(data.settings.free_over)
					})}
				</p>
				<p class="ii-label">{t('shop.paymentMethods')}</p>
			</div>

		</div>
	</main>

	<div class="foot-col">
		<Foot />
	</div>
</div>

<style>
	/* full width of the screen: .ii-main holds the gutter, so the strip is
	   pulled back out of it */
	.gallery {
		display: flex;
		width: 100vw;
		margin-left: calc(-1 * var(--ii-gutter));
		overflow-x: auto;
		overscroll-behavior-x: contain;
		scroll-snap-type: x mandatory;
		-webkit-overflow-scrolling: touch;
		scrollbar-width: none;
	}
	.gallery::-webkit-scrollbar {
		display: none;
	}
	.shot {
		flex: 0 0 100vw;
		scroll-snap-align: start;
		aspect-ratio: 4 / 5;
		margin: 0;
	}
	.shot img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.count {
		margin-top: 12px;
	}

	.info {
		margin-top: 44px;
	}
	/* the Japanese face comes in at line-height 1.8, which is leading for body
	   copy, not for a 28/44px title */
	h1.title {
		line-height: 1.3;
	}
	.spec {
		margin-top: 10px;
	}
	.price {
		margin-top: 22px;
	}
	.tax {
		margin-left: 6px;
	}
	.desc {
		margin-top: 34px;
		white-space: pre-line;
		max-width: 348px;
	}

	.buy-row {
		display: flex;
		align-items: flex-end;
		gap: 20px;
		margin-top: 44px;
	}
	.qty {
		flex: 0 0 76px;
	}
	/* ii.css resets `.ii select` at (0,1,1), which outranks .ii-caret (0,1,0)
	   and takes the hairline arrow with the `background` shorthand; .ii-field
	   select then wins padding at (0,2,0). This selector carries the Svelte
	   hash, so the caret the class asks for comes back. The class stays on the
	   element: when ii.css is corrected, this rule becomes a no-op. */
	.qty select {
		background-image: linear-gradient(45deg, transparent 50%, var(--ii-mute) 50%),
			linear-gradient(135deg, var(--ii-mute) 50%, transparent 50%);
		background-position: right 5px top 1.05em, right 1px top 1.05em;
		background-size: 4px 4px, 4px 4px;
		background-repeat: no-repeat;
		padding-right: 16px;
	}
	.add {
		flex: 1;
		max-width: 260px;
	}
	/* same clash: `.ii button` (0,1,1) strips .ii-btn's border and resets its
	   size to inherit. Restored here rather than in the shared sheet. */
	.add.ii-btn {
		border: 1px solid var(--ii-ink);
		font-size: 11px;
		line-height: 1.8;
	}
	.low-stock {
		margin-top: 14px;
		color: var(--ii-alert);
	}
	/* sold out takes the button's shape so the control sits in one place
	   whatever the state — it just is not something you can press */
	.soldout {
		display: block;
		margin-top: 32px;
		max-width: 28ch;
		letter-spacing: 0.18em;
	}
	.add {
		display: flex;
		align-items: baseline;
		justify-content: center;
		gap: 10px;
	}
	.add .ja {
		font-size: 11px;
	}

	.notes {
		margin-top: 34px;
	}
	.notes p + p {
		margin-top: 6px;
	}

	@media screen and (min-width: 720px) {
		.ii-main.product {
			/* against the fixed panel the column wants more breathing room than
			   the rest of the site's 50px gutter */
			padding-inline: 100px;
		}
		.product {
			/* the panel owns the left half of the screen, so the page is one
			   column in the other half */
			/* `.ii main` is width:100%, so the 50vw margin alone pushed the column
			   off the right edge */
			margin-left: 50vw;
			width: 50vw;
			display: block;
			/* No invented height. The page is as long as what is written on it;
			   the shots are paced across whatever scroll that gives. */
			min-height: calc(100vh - 22vh);
		}
		/* the foot sits under the reading column, clear of the fixed panel */
		.foot-col {
			margin-left: 50vw;
			width: 50vw;
		}
		/* the strip hands over to the fixed panel */
		.gallery,
		.count {
			display: none;
		}
		.panel {
			position: fixed;
			top: 0;
			left: 0;
			width: 50vw;
			height: 100vh;
			height: 100dvh;
			z-index: 1;
			overflow: hidden;
			background: var(--ii-rule-soft);
		}
		/* opacity is driven frame by frame from the eased position, so there is
		   no CSS transition to fight it */
		.pane {
			position: absolute;
			inset: 0;
			width: 100%;
			height: 100%;
			object-fit: cover;
		}
		.info {
			margin-top: 0;
			max-width: none;
		}
		.desc {
			max-width: none;
		}
		.add {
			max-width: 300px;
		}
	}
</style>
