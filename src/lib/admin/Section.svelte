<script>
	// A titled block. Used to break settings and detail screens into parts.
	export let title = '';
	export let desc = '';
</script>

<section class="sec">
	<div class="sec-head">
		<h2 class="serif">{title}</h2>
		{#if desc}<p class="desc">{desc}</p>{/if}
	</div>
	<div class="sec-body"><slot /></div>
</section>

<style>
	/* base.css puts page gutters on every <section> — not wanted inside the shell */
	.sec {
		padding-left: 0;
		padding-right: 0;
		margin-bottom: 4rem;
	}
	.sec:last-child {
		margin-bottom: 0;
	}
	.sec-head {
		margin-bottom: 1.6rem;
	}
	h2 {
		font-size: 1.6rem;
		line-height: 1.4;
		color: var(--blackColor);
	}
	.desc {
		margin-top: 0.6rem;
		max-width: 56rem;
		font-size: 1.1rem;
		line-height: 1.8;
		text-align: left;
		color: var(--subColor);
	}
	@media screen and (min-width: 900px) {
		.sec {
			margin-bottom: 5.6rem;
		}
	}
</style>
