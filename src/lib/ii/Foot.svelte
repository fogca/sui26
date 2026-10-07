<script>
	// The foot of the page: Contact, the signature, then the statutory link and
	// the copyright line.
	//
	// 特定商取引法に基づく表記 is kept as its own labelled link rather than folded
	// into a general "Legal" page — the Act requires the information to be
	// displayed, and the guidance is that a buyer must be able to find it
	// easily, which a generic label works against.
	import { page } from '$app/stores';
	import {translator, both} from '$lib/i18n.js';

	/** The shop pages carry the statutory link in their own flow already. */
	export let legal = true;

	$: lang = $page.data?.lang ?? 'ja';
	$: t = translator(lang);
	$: legalLabel = both('shop.legal');
</script>

<footer class="foot">
	<nav class="top">
		<a class="ii-body" href={'/contact'} lang="en">{t('nav.contact')}</a>
	</nav>

	<span class="studio" lang="en">scent studio</span>

	<div class="base">
		<nav class="legal">
			{#if legal}
				<a class="ii-label" href={'/shop/legal'}>
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
		padding: 96px 21px calc(20px + env(safe-area-inset-bottom));
	}
	.top {
		margin-bottom: 44px;
	}
	.studio {
		display: block;
		font-weight: var(--ii-thin);
		font-size: 12px;
		line-height: 1.2;
		letter-spacing: 0.02em;
	}

	.base {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 8px 16px;
		margin-top: 14px;
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
			padding: 140px 50px 30px;
		}
		.top {
			margin-bottom: 56px;
		}
		.studio {
			font-size: 13px;
		}
	}
</style>
