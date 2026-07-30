<script>
	import Header from '../../components/Header.svelte';
	import { works } from '$lib/works.js';

	// same source list as the home intro loop, deduped by credit name for a
	// clean static index (home shows every image incl. repeats; here each
	// collaborator appears once)
	const seen = new Set();
	const items = works.filter((w) => (seen.has(w.text) ? false : seen.add(w.text)));
</script>

<svelte:head>
	<title>Works — SUI scent studio</title>
</svelte:head>

<Header />

<section class="works">
	<div class="wrapper">
		<h1 class="serif">Works</h1>

		<ul class="grid">
			{#each items as w}
				<li>
					<div class="thumb"><img src={w.image} alt={w.text} /></div>
					<span class="name serif">{w.text}</span>
				</li>
			{/each}
		</ul>
	</div>
</section>

<style>
	.works {
		min-height: 100vh;
		min-height: 100dvh;
		padding-top: 22vh;
		padding-bottom: 12rem;
	}
	.wrapper {
		margin-left: 30%;
	}
	h1 {
		font-size: 2rem;
		letter-spacing: 0.05em;
		margin-bottom: 4rem;
	}
	.grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 3rem 2.4rem;
		max-width: 72rem;
	}
	.thumb {
		aspect-ratio: 4 / 5;
		overflow: hidden;
		margin-bottom: 0.8rem;
		background: #f1efec;
	}
	.thumb img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.name {
		font-size: 1.3rem;
	}

	@media screen and (min-width: 720px) {
		.works {
			padding-top: 28vh;
		}
		.wrapper {
			margin-left: 52.5%;
			padding-right: var(--pcPadding);
		}
		.grid {
			grid-template-columns: 1fr 1fr;
		}
	}
</style>
