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
</style>
