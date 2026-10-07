<script>
	// Test page — colour fields as a brand background. Not linked from the site
	// and marked noindex; it exists to be looked at and chosen from.
	import Field from '$lib/ii/Field.svelte';
	import { STUDIES } from '$lib/lab/studies.js';
	import Chrome from '$lib/ii/Chrome.svelte';

	/** Lay the brand's own type over every field. A background is only good if
	 *  the words on it stay readable, so this is the real test, not a garnish. */
	let withType = false;
	/** Which field, if any, is filling the viewport. */
	let full = null;

	function toggleFull(id) {
		full = full === id ? null : id;
	}

	function onKey(e) {
		if (e.key === 'Escape') full = null;
	}
</script>

<svelte:head>
	<title>Field — SUI scent studio</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<svelte:window on:keydown={onKey} />

<div class="ii-page">
	<Chrome tone="ink" />

	<main class="ii-main">
		<h1 class="ii-display" lang="en">Field</h1>
		<p class="ii-jp intro" lang="ja">
			香りのブランドの地として使う、移ろう色の面。自然の光のなかにある色だけで組み、風がそよぐ速さで流れます。
		</p>

		<button class="toggle ii-label" type="button" on:click={() => (withType = !withType)} lang="ja">
			{withType ? '文字を外す' : '文字を重ねて確かめる'}
		</button>

		<ul class="studies">
			{#each STUDIES as s (s.id)}
				<li class="study">
					<div class="slot" class:is-full={full === s.id}>
						<div class="frame" class:is-full={full === s.id}>
							<Field study={s} />

							{#if withType}
								<div class="over">
									<img src="/ii/wordmark-ink.svg" alt="" width="67" height="34" />
									<p class="ii-jp line" lang="ja">森羅万象に香る響きを紡いでいきたい。</p>
									<p class="ii-body line" lang="en">Weaving the resonance that scents all creation.</p>
								</div>
							{/if}

							<button
								class="hit"
								type="button"
								on:click={() => toggleFull(s.id)}
								aria-label={full === s.id ? 'Close' : s.en}
							></button>

							{#if full === s.id}
								<span class="esc ii-label" lang="en">Esc</span>
							{/if}
						</div>
					</div>

					<div class="caption">
						<span class="ii-lead name" lang="ja">{s.ja}</span>
						<span class="ii-body en" lang="en">{s.en}</span>
						<span class="ii-jp note" lang="ja">{s.note}</span>
						<span class="swatches" aria-hidden="true">
							{#each s.colors as c}
								<i style="background:{c}"></i>
							{/each}
						</span>
					</div>
				</li>
			{/each}
		</ul>
	</main>
</div>

<style>
	.intro {
		margin-top: 28px;
		max-width: 34em;
	}
	.toggle {
		margin-top: 36px;
		padding: 10px 16px;
		border: 1px solid var(--ii-rule);
		cursor: pointer;
		transition: border-color 0.5s ease;
	}
	.toggle:hover {
		border-color: var(--ii-ink);
	}

	.studies {
		margin-top: 56px;
		display: flex;
		flex-direction: column;
		gap: 72px;
	}

	/* the slot holds the space so the page does not jump when a field is
	   lifted out of flow to fill the viewport */
	.slot {
		position: relative;
		height: 62vh;
		min-height: 320px;
	}
	.frame {
		position: absolute;
		inset: 0;
		overflow: hidden;
	}
	.frame.is-full {
		position: fixed;
		inset: 0;
		z-index: 90;
	}

	.hit {
		position: absolute;
		inset: 0;
		cursor: pointer;
		background: transparent;
	}

	.over {
		position: absolute;
		left: var(--ii-gutter);
		bottom: 8%;
		z-index: 2;
		pointer-events: none;
		display: flex;
		flex-direction: column;
		gap: 14px;
		align-items: flex-start;
	}
	.over img {
		width: 67px;
		height: auto;
	}
	.over .line {
		margin: 0;
	}

	.esc {
		position: absolute;
		top: calc(20px + env(safe-area-inset-top));
		right: 20px;
		z-index: 3;
		pointer-events: none;
	}

	.caption {
		display: flex;
		align-items: baseline;
		flex-wrap: wrap;
		gap: 6px 14px;
		margin-top: 18px;
	}
	.caption .note {
		color: var(--ii-mute);
	}
	.swatches {
		display: inline-flex;
		gap: 4px;
		margin-left: auto;
	}
	.swatches i {
		width: 14px;
		height: 14px;
		display: block;
	}

	@media screen and (min-width: 720px) {
		.studies {
			margin-top: 80px;
			gap: 104px;
		}
		.slot {
			height: 78vh;
		}
		.over img {
			width: 86px;
		}
	}
</style>
