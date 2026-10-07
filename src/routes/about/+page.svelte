<script>
	// About — Figma 128:284, redrawn on the water field. The surface is the
	// site-wide field, fixed behind everything, and all of the type is white
	// over it.
	//
	// Frame measurements at 393 x 720: title left 21 / top 141 / 32px,
	// English body left 21 / top 195 / 13px at 1.4 / 348 wide, Japanese left 21
	// / top 467 / 11px at 1.8.
	//
	// The frame holds the statement only. The live page carries three credit
	// lists after it (composition / exhibitions / international), which the
	// frame never had to solve, so they take the quiet treatment the direction
	// allows: a hairline, an English label, and the Japanese run beneath it.
	import { page } from '$app/stores';
	import Surface from '$lib/ii/Surface.svelte';
	import Chrome from '$lib/ii/Chrome.svelte';
	import Foot from '$lib/ii/Foot.svelte';
	import { translator, localizePath, splitLang } from '$lib/i18n.js';

	export let data;

	const SITE = 'https://sui-sari.hi-843.workers.dev';

	$: t = translator(data.lang);
	// hreflang pair for this page, derived from the un-prefixed route
	$: jaPath = splitLang($page.url.pathname).path;
</script>

<svelte:head>
	<title>About — {t('common.siteName')}</title>
	<link rel="canonical" href="{SITE}{jaPath}" />
</svelte:head>

<div class="ii-page on-field">
	<Surface />
	<Chrome tone="over" />

	<main class="ii-main">
		<h1 class="ii-display title" lang="en">{t('about.title')}</h1>

		<div class="copy">
			<!-- Japanese then English: the studio's own language leads the page, and
			     the English follows it. There is no language switch — both are
			     simply here. -->
			<div class="ja statement" lang="ja">
				<p class="ii-jp">
					日本の伝統的な香道と世界の香文化や素材との対話を背景に、「匂い」という現象の神秘を核に据えて、未来へ織り継ぐ香の道を探求。<br
					/>従来の香水の枠を超え、建築空間やメゾン、化粧品、菓子や飲料など、多様な領域で調香や香会をひらいている。
				</p>
				<p class="ii-jp">
					植物や鉱物の抽出を手がかりに、<br />森羅万象に香る響きを紡いでいきたい。
				</p>
				<p class="ii-jp award">フレグランスコンテスト環境大臣賞受賞</p>
			</div>

			<div class="en statement">
				<!-- Japan's: the source typed a curly apostrophe (U+2019), which Ango
				     does not draw, so it would fall back to Garamond mid-word -->
				<p class="ii-body" lang="en">
					Working from a dialogue between Japan's traditional art of kōdō and the
					scent cultures and materials of the wider world, Sari explores a path of
					fragrance to be woven onward into the future, with the mystery of the
					phenomenon we call smell held at its core.<br />
					Beyond the frame of conventional perfumery, she composes scents and holds
					scent gatherings across many fields — architectural spaces, maisons,
					cosmetics, confectionery and beverages.
				</p>
				<p class="ii-body" lang="en">
					Taking the extraction of plants and minerals as her guide, she hopes to weave
					the resonance that scents all creation.
				</p>
				<p class="ii-body award" lang="en">
					Minister of the Environment Award, Fragrance Contest
				</p>
			</div>

			<!-- the runs are the same source data in either language, so they are
			     shown once, under an English label -->
			<div class="credits">
				<div class="group">
					<p class="ii-label lbl" lang="en">Fragrance composition</p>
					<p class="ii-jp run" lang="ja">KIGI / La Cime / La Nuit Parfum / R.alagan / SENN / SONY / The Tea Company / MARUYO HOTEL / MiM / エスパシオ箱根迎賓館 / 直島旅館 ろ霞 ほか</p>
				</div>
				<div class="group">
					<p class="ii-label lbl" lang="en">Exhibitions and scent gatherings</p>
					<p class="ii-jp run" lang="ja">Bottega Veneta / gallery crossing /HERMES skill academy / LEXUS /組む東京 / 小石川植物園 / 東京大学 / 森岡書店 / 八雲茶寮 ほか（abc,五十音順）</p>
				</div>
				<div class="group">
					<p class="ii-label lbl" lang="en">International</p>
					<p class="ii-jp run" lang="ja">CRES in USA / Expo 2015 Milano / MARIA VAN RENSWN Switzerland / Milan Design Week / public record NZ / SIGMA Shanghai / Tour Japan in Franceほか</p>
				</div>
			</div>
		</div>
	</main>

	<Foot />
</div>

<style>
	/* `.ii [lang='ja']` is (0,2,0) and would hand the Japanese title 1.8
	   leading, so the two languages would sit at different heights. */
	/* `.ii [lang='ja']` is (0,2,0) and would hand the Japanese title 1.8
	   leading, so the two languages would sit at different heights. */
	/* the copy sets to 90% of the column on a phone — the full measure ran
	   right to the gutter */
	.copy {
		width: 90%;
	}

	h1.title {
		font-size: 32px;
		line-height: 1.2;
		letter-spacing: 0.02em;
		/* the frame's 141 -> 195 is top to top, so the gap is what is left under
		   a 32px line at 1.2: 195 - (141 + 38.4) */
		margin-bottom: 15.6px;
	}

	.en p {
		max-width: 348px;
		font-size: 14px;
		line-height: 1.4;
		letter-spacing: 0.025em;
		/* the measure is narrow at this size, so the long words are allowed to
		   break rather than leaving holes in the rag */
		hyphens: auto;
		-webkit-hyphens: auto;
	}
	/* one blank line, as the frame sets it */
	.en p + p {
		margin-top: 18.2px;
	}
	/* two */
	.en p + p.award {
		margin-top: 36.4px;
	}
	.en.statement {
		margin-top: 34px;
	}
	.ja.statement p {
		font-size: 13.5px;
	}
	.ja p + p {
		margin-top: 19.8px;
	}
	.ja p + p.award {
		margin-top: 59.4px;
	}

	/* The credits are the quiet matter of the page: hairline, label, run. */
	.credits {
		margin-top: 56px;
	}
	.group + .group {
		margin-top: 32px;
	}
	.lbl {
		margin-bottom: 3px;
	}

	@media screen and (min-width: 720px) {
		h1.title {
			margin-bottom: 40px;
		}
		/* two columns across — the Japanese statement and the English one — with
		   the runs on their own row underneath rather than squeezed in beside
		   them */
		.copy {
			display: grid;
			/* two text columns that stop short of the right edge — the third track
			   carries nothing and is there to hold that margin open */
			grid-template-columns: minmax(0, 0.75fr) minmax(0, 0.75fr) minmax(0, 0.25fr);
			gap: 0 3vw;
			align-items: start;
			/* the 90% measure is a phone setting */
			width: auto;
		}
		.credits {
			grid-column: 1 / -1;
			width: 38%;
			margin-top: 64px;
		}
		.en p {
			max-width: none;
			font-size: 14px;
			line-height: 1.6;
			/* the tracking and the hyphenation are phone settings too — this
			   column is wide enough to set without either */
			letter-spacing: 0.03em;
			hyphens: manual;
			-webkit-hyphens: manual;
		}
		/* the credits keep the smaller .ii-jp size; only the statement grows */
		.ja.statement p {
			font-size: 16px;
		}
		/* side by side, so neither column is pushed down */
		.en.statement {
			margin-top: 0;
		}
		.group + .group {
			margin-top: 25px;
		}
	}
</style>
