<script>
	import Header from '../../components/Header.svelte';
	export let data;
</script>

<svelte:head>
	<title>log — SUI scent studio</title>
</svelte:head>

<Header />

<section class="log-index">
	<div class="wrapper">
		<h1 class="index-title serif">log</h1>

		<ul class="post-list">
			{#each data.posts as post (post.slug)}
				<li class="post-row">
					<a href="/log/{post.slug}">
						{#if post.cover}
							<div class="thumb"><img src={post.cover} alt="" /></div>
						{/if}
						<div class="meta">
							<time class="date">{post.date}</time>
							<span class="title serif">{post.title}</span>
						</div>
					</a>
				</li>
			{/each}
		</ul>
	</div>
</section>

<style>
	.log-index {
		min-height: 100vh;
		min-height: 100dvh;
		padding-top: 22vh;
		padding-bottom: 10rem;
	}
	.wrapper {
		margin-left: 30%;
	}
	.index-title {
		font-size: 2rem;
		letter-spacing: 0.05em;
		margin-bottom: 4rem;
	}

	.post-list {
		display: flex;
		flex-direction: column;
		gap: 2.8rem;
	}
	.post-row a {
		display: flex;
		align-items: baseline;
		gap: 1.4rem;
		width: 100%;
	}
	.thumb {
		width: 6rem;
		flex: 0 0 auto;
		align-self: flex-start;
	}
	.thumb img {
		width: 100%;
		height: 7.2rem;
		object-fit: cover;
	}
	.meta {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}
	.date {
		font-size: 1rem;
		color: var(--subColor);
		letter-spacing: 0.03em;
	}
	.title {
		font-size: 1.5rem;
		line-height: 1.4;
	}

	@media screen and (min-width: 720px) {
		.log-index {
			padding-top: 30vh;
		}
		.wrapper {
			margin-left: 52.5%;
		}
		.title {
			font-size: 1.6rem;
		}
	}
</style>
