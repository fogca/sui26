<script>
	// Query-string pagination. `params` is the current query as a plain object;
	// every key except `page` is carried over so filters survive paging.
	export let page = 1;
	export let pages = 1;
	export let params = {};

	const WINDOW = 1; // neighbours shown either side of the current page

	$: current = clamp(Number(page) || 1, 1, Math.max(1, Number(pages) || 1));
	$: total = Math.max(1, Number(pages) || 1);
	$: items = buildItems(current, total);

	function clamp(n, lo, hi) {
		return Math.min(hi, Math.max(lo, n));
	}

	function hrefFor(n) {
		const q = new URLSearchParams();
		for (const [k, v] of Object.entries(params || {})) {
			if (k === 'page') continue;
			if (v === undefined || v === null || v === '') continue;
			q.set(k, String(v));
		}
		if (n > 1) q.set('page', String(n));
		const s = q.toString();
		return s ? '?' + s : '?';
	}

	function buildItems(cur, max) {
		const wanted = new Set([1, max, cur]);
		for (let d = 1; d <= WINDOW; d++) {
			wanted.add(cur - d);
			wanted.add(cur + d);
		}
		const nums = [...wanted].filter((n) => n >= 1 && n <= max).sort((a, b) => a - b);
		const out = [];
		let prev = 0;
		for (const n of nums) {
			if (prev && n - prev > 1) out.push({ gap: true });
			out.push({ n });
			prev = n;
		}
		return out;
	}
</script>

{#if total > 1}
	<nav class="pager" aria-label="ページ送り">
		{#if current > 1}
			<a class="step" href={hrefFor(current - 1)} rel="prev">← 前へ</a>
		{:else}
			<span class="step off">← 前へ</span>
		{/if}

		<span class="nums">
			{#each items as it, i (i)}
				{#if it.gap}
					<span class="gap">…</span>
				{:else if it.n === current}
					<span class="num on" aria-current="page">{it.n}</span>
				{:else}
					<a class="num" href={hrefFor(it.n)}>{it.n}</a>
				{/if}
			{/each}
		</span>

		{#if current < total}
			<a class="step" href={hrefFor(current + 1)} rel="next">次へ →</a>
		{:else}
			<span class="step off">次へ →</span>
		{/if}
	</nav>
{/if}

<style>
	.pager {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: center;
		gap: 0.4rem 1.6rem;
		margin-top: 3.2rem;
		padding-top: 2rem;
		border-top: 1px solid #f0eeec;
		font-variant-numeric: tabular-nums;
	}
	.nums {
		display: flex;
		align-items: center;
		gap: 0.2rem;
	}
	.num,
	.step,
	.gap {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 2.8rem;
		height: 2.8rem;
		padding: 0 0.6rem;
		font-size: 1.1rem;
		line-height: 1;
		letter-spacing: 0.02em;
		color: var(--textColor);
		border-radius: 2px;
		transition:
			background-color 0.18s ease,
			color 0.18s ease;
	}
	.num:hover,
	.step:hover {
		opacity: 1;
		background-color: rgba(0, 0, 0, 0.03);
		color: var(--blackColor);
	}
	.num.on {
		color: var(--blackColor);
		border-bottom: 1px solid var(--blackColor);
		border-radius: 0;
	}
	.step.off,
	.gap {
		color: #c8c4c0;
	}
	.gap {
		min-width: 1.6rem;
	}
</style>
