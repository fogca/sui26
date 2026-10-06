<script>
	// One filter row above everything it scopes. Never put filters inside a card.
</script>

<div class="toolbar"><slot /></div>

<style>
	.toolbar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.8rem 1.2rem;
		padding-bottom: 1.6rem;
		margin-bottom: 2rem;
		border-bottom: 1px solid #f0eeec;
	}
	.toolbar :global(.spacer) {
		margin-left: auto;
	}
	@media screen and (min-width: 900px) {
		.toolbar {
			padding-bottom: 1.8rem;
			margin-bottom: 2.4rem;
		}
	}
</style>
