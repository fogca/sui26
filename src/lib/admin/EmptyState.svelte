<script>
	// Nothing here yet — say so plainly and offer the one next step.
	export let text = 'データがありません。';
	export let actionHref = '';
	export let actionLabel = '';
</script>

<div class="empty">
	<p>{text}</p>
	{#if actionHref && actionLabel}
		<a class="a-btn" href={actionHref}>{actionLabel}</a>
	{/if}
	<slot />
</div>

<style>
	.empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.6rem;
		padding: 6rem 2rem;
		border: 1px solid #f0eeec;
		border-radius: 3px;
		background-color: #fdfdfc;
		text-align: center;
	}
	p {
		font-size: 1.2rem;
		line-height: 1.8;
		text-align: center;
		color: var(--subColor);
	}
</style>
