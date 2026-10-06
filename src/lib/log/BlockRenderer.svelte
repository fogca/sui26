<script>
	// Shared renderer for a block array. The same component drives the public
	// view and (later) the inline editor — only `mode` differs, so markup and
	// base.css styling never diverge between reading and editing.
	/** @type {import('./posts.js').Block[]} */
	export let blocks = [];
	/** @type {'view'|'edit'} */
	export let mode = 'view';
</script>

<div class="blocks" data-mode={mode}>
	{#each blocks as block (block.id)}
		{#if block.type === 'title'}
			<h2 class="block-title serif">{block.text}</h2>
		{:else if block.type === 'text'}
			<p class="block-text">{block.text}</p>
		{:else if block.type === 'image'}
			<figure class="block-image">
				<img src={block.src} alt={block.alt ?? ''} />
				{#if block.caption}
					<figcaption>{block.caption}</figcaption>
				{/if}
			</figure>
		{/if}
	{/each}
</div>

<style>
	.blocks {
		display: flex;
		flex-direction: column;
		gap: 2.4rem;
	}

	.block-title {
		font-size: 1.8rem;
		line-height: 1.4;
		letter-spacing: 0.05em;
		margin-bottom: 0.4rem;
	}

	.block-text {
		/* preserve authored line breaks from the plain-text block */
		white-space: pre-line;
		color: var(--textColor);
	}

	.block-image {
		margin: 0;
	}
	.block-image img {
		width: 100%;
		height: auto;
	}
	.block-image figcaption {
		margin-top: 0.6rem;
		font-size: 1rem;
		color: var(--subColor);
		text-align: right;
	}

	@media screen and (min-width: 720px) {
		.blocks {
			gap: 3.2rem;
		}
	}

	/* --- the "II" direction, public view only ---------------------------- */

	/* This component is shared with the inline editor, which sits outside .ii
	   and has to keep the base.css look, so the direction is added here as
	   overrides rather than by rewriting the rules above. Svelte compiles
	   `:global(.ii) .block-text` to `.ii .block-text.svelte-xxx`, one class
	   more specific than the plain scoped rule, so the public view takes these
	   and the editor is untouched.

	   The body is Japanese, so it takes .ii-jp metrics; `.ii [lang='ja'] *`
	   (0,2,0) still supplies the gothic and its 0.05em tracking, and is left
	   to do so — only size, leading and colour are stated here. */
	:global(.ii) .blocks {
		gap: 34px;
	}
	:global(.ii) .block-title {
		font-size: 20px;
		line-height: 1.4;
		letter-spacing: var(--ii-jp-track);
		margin-bottom: 0;
	}
	/* `.block-title` also carries `.serif`, which the editor still needs. On the
	   English page that class pulls base.css's Japanese *serif* (Akashi) back in
	   through `:lang(en) [lang='ja'] .serif` (0,3,0), which outranks the
	   direction's `.ii [lang='ja'] *` (0,2,0) — so the heading came out in a
	   different face from the gothic body copy beneath it, on /en only.
	   Naming `.serif` here takes the rule to (0,4,0) and hands the gothic back. */
	:global(.ii) .block-title.serif {
		font-family: var(--ii-jp);
	}
	:global(.ii) .block-text {
		font-size: 11px;
		line-height: 1.8;
		color: inherit;
	}
	:global(.ii) .block-image figcaption {
		margin-top: 8px;
		font-size: 10px;
		line-height: 1.4;
		letter-spacing: 0.06em;
		text-align: left;
		color: var(--ii-mute);
	}

	@media screen and (min-width: 720px) {
		:global(.ii) .blocks {
			gap: 44px;
		}
		:global(.ii) .block-title {
			font-size: 30px;
		}
		:global(.ii) .block-text {
			font-size: 12.5px;
		}
		:global(.ii) .block-image figcaption {
			font-size: 11px;
		}
	}
</style>
