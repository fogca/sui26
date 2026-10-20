<script>
	// The foot of the page, on an ink ground.
	//
	// Laid out the way the office's own sites are (Dev/OTIF, Dev/ii): the mark
	// and where the studio is on the left, the site's own list beside it, the
	// way to get in touch on the right, and a hairline over a last row of the
	// statutory link and the copyright. Every word in it is one the site
	// already says somewhere — none of this is new copy.
	//
	// 特定商取引法表記 is its own labelled link rather than folded into a general
	// "Legal" page: the Act requires the information to be displayed, and the
	// guidance is that a buyer must be able to find it easily, which a generic
	// label works against.
	import { page } from '$app/stores';
	import { translator, both } from '$lib/i18n.js';

	/** The shop pages carry the statutory link in their own flow already. */
	export let legal = true;

	$: lang = $page.data?.lang ?? 'ja';
	$: t = translator(lang);
	$: legalLabel = both('shop.legal');

	$: links = [
		{ label: t('nav.fragrance'), href: '/shop' },
		{ label: t('nav.works'), href: '/works' },
		{ label: t('nav.about'), href: '/about' },
		{ label: t('nav.contact'), href: '/contact' }
	];
</script>

<footer class="foot on-field">
	<div class="grid">
		<div class="col brand">
			<img class="mark" src="/ii/wordmark-white.svg" alt="SUI" width="86" height="44" />
			<p class="ii-body where" lang="en">scent studio<br />in Nagano Japan</p>
		</div>

		<nav class="col" aria-label="Footer">
			<ul class="list">
				{#each links as l}
					<li>
						<a class="ii-body" class:current={$page.url.pathname === l.href} href={l.href}
							>{l.label}</a
						>
					</li>
				{/each}
			</ul>
		</nav>

		<div class="col cta">
			<a class="ii-display reach" href="/contact" lang="en">{t('common.getInTouch')} →</a>
		</div>
	</div>

	<div class="base">
		<nav class="legal">
			{#if legal}
				<a class="ii-label" href="/shop/legal">
					<span class="ja" lang="ja">{legalLabel.ja}</span>
					<span class="en" lang="en">{legalLabel.en}</span>
				</a>
			{/if}
		</nav>

		<!-- Ango has no © yet, so that one character comes from Garamond -->
		<span class="ii-label copy" lang="en">© SUI, 2026 All Rights Reserved</span>
	</div>
</footer>

<style>
	.foot {
		position: relative;
		z-index: 1;
		/* .on-field turns --ii-ink white on this very element, so the ground
		   cannot ask for the ink by that name — this is ii.css's own value. The
		   class is what carries the rest: white type, and rules and mutes that
		   invert with it. */
		background: #394750;
		padding: 96px 21px calc(40px + env(safe-area-inset-bottom));
	}

	.grid {
		display: flex;
		flex-direction: column;
		gap: 44px;
	}
	.mark {
		display: block;
		width: 86px;
		height: auto;
	}
	.where {
		margin-top: 18px;
	}

	.list {
		display: flex;
		flex-direction: column;
		gap: 9px;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.list .current {
		opacity: 0.55;
	}

	/* `.ii a` is (0,2,0) and sets display: block — named through its column so
	   this wins, or the rule under it runs the whole width of the track
	   instead of the width of the words. */
	.cta .reach {
		display: inline-block;
		border-bottom: 1px solid var(--ii-rule);
		padding-bottom: 6px;
	}

	.base {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 8px 16px;
		margin-top: 72px;
		padding-top: 18px;
		border-top: 1px solid var(--ii-rule-soft);
	}
	.legal a {
		display: flex;
		align-items: baseline;
		flex-wrap: wrap;
		gap: 2px 10px;
	}
	/* the language that follows is the quieter one */
	.legal .en {
		opacity: 0.78;
	}
	.copy {
		white-space: nowrap;
	}

	@media screen and (min-width: 720px) {
		.foot {
			padding: 140px 50px 56px;
		}
		.grid {
			display: grid;
			/* the mark, the list, and the way in — the last one held to the right
			   so the row reads as two ends rather than three starts */
			grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr) auto;
			gap: 0 5vw;
			align-items: start;
		}
		.cta {
			justify-self: end;
			text-align: right;
		}
		.base {
			margin-top: 120px;
		}
	}
</style>
