<script>
	import Header from '../../../components/Header.svelte';
	import BlockRenderer from '$lib/log/BlockRenderer.svelte';
	export let data;
</script>

<svelte:head>
	<title>{data.post.title} — SUI scent studio</title>
</svelte:head>

<Header />

<section class="log-article">
	<article class="wrapper">
		<time class="date">{data.post.date}</time>
		<BlockRenderer blocks={data.post.blocks} />
		<a class="back" href="/log">← log</a>
	</article>
</section>

<style>
	.log-article {
		min-height: 100vh;
		min-height: 100dvh;
		padding-top: 18vh;
		padding-bottom: 12rem;
	}
	.wrapper {
		margin-left: 30%;
		max-width: 46rem;
	}
	.date {
		display: block;
		font-size: 1rem;
		color: var(--subColor);
		letter-spacing: 0.03em;
		margin-bottom: 2.4rem;
	}
	.back {
		display: inline-block;
		margin-top: 5rem;
		font-size: 1.1rem;
		color: var(--subColor);
	}

	@media screen and (min-width: 720px) {
		.log-article {
			padding-top: 24vh;
		}
		.wrapper {
			margin-left: 52.5%;
		}
	}
</style>
