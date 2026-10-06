<script>
	// The frames end on "scent studio" at the lower left and nothing else. The
	// nav that used to live here has moved into the chrome, which is fixed now;
	// the statutory link stays because the shop is legally required to carry it.
	import { page } from '$app/stores';
	import { localizePath, translator } from '$lib/i18n.js';

	/** The shop pages carry the legal link in their own flow already. */
	export let legal = true;

	$: lang = $page.data?.lang ?? 'ja';
	$: t = translator(lang);
	$: path = (p) => localizePath(p, lang);
</script>

<footer class="foot">
	<span class="studio" lang="en">scent studio</span>
	{#if legal}
		<a class="ii-label legal" href={path('/shop/legal')} lang={lang}>{t('shop.legal')}</a>
	{/if}
</footer>

<style>
	.foot {
		position: relative;
		z-index: 1;
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 16px;
		/* the frame puts the signature 32px off the foot of the page */
		padding: 96px 21px calc(20px + env(safe-area-inset-bottom));
	}
	.studio {
		font-weight: var(--ii-thin);
		font-size: 12px;
		line-height: 1.2;
		letter-spacing: 0.02em;
	}
	.legal {
		opacity: 0.8;
	}

	@media screen and (min-width: 720px) {
		.foot {
			padding: 140px 4.4vw 30px;
		}
		.studio {
			font-size: 13px;
		}
	}
</style>
