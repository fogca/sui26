<script>
	// A single headline number. Never render this as a one-bar chart.
	export let label = '';
	export let value = '';
	export let unit = '';
	export let sub = '';
	/** Month-over-month change in percent, or null when unknown. */
	export let delta = null;
	export let tone = 'default';
	export let href = '';

	$: hasDelta = delta !== null && delta !== undefined && Number.isFinite(Number(delta));
	$: deltaNum = hasDelta ? Number(delta) : 0;
	$: deltaDir = deltaNum > 0 ? 'up' : deltaNum < 0 ? 'down' : 'flat';
	// Direction is never carried by color alone — the arrow and the word ride along.
	$: deltaText =
		deltaDir === 'up'
			? '↑ ' + fmtPct(deltaNum)
			: deltaDir === 'down'
				? '↓ ' + fmtPct(Math.abs(deltaNum))
				: '± 0%';

	function fmtPct(n) {
		const r = Math.round(Math.abs(n) * 10) / 10;
		return r.toLocaleString('ja-JP') + '%';
	}
</script>

<svelte:element
	this={href ? 'a' : 'div'}
	class="stat tone-{tone}"
	class:linked={!!href}
	{...href ? { href } : {}}
>
	<span class="label">{label}</span>
	<span class="value">
		{value}{#if unit}<small>{unit}</small>{/if}
	</span>

	{#if hasDelta || sub}
		<span class="foot">
			{#if hasDelta}
				<span class="delta {deltaDir}">{deltaText}</span>
				<span class="vs">前月比</span>
			{/if}
			{#if sub}<span class="sub">{sub}</span>{/if}
		</span>
	{/if}

	<slot />
</svelte:element>

<style>
	.stat {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		padding: 1.8rem;
		background-color: #fff;
		border: 1px solid #eee;
		border-radius: 3px;
		transition:
			border-color 0.18s ease,
			background-color 0.18s ease;
	}
	.stat.linked,
	.stat.linked:hover {
		opacity: 1;
	}
	.stat.linked:hover {
		border-color: #ddd8d3;
	}
	.label {
		font-size: 1.05rem;
		line-height: 1.4;
		letter-spacing: 0.04em;
		color: var(--subColor);
	}
	/* proportional figures — tabular-nums makes big numbers look loose */
	.value {
		font-size: 2.6rem;
		line-height: 1.15;
		letter-spacing: 0;
		color: var(--blackColor);
	}
	.value small {
		font-size: 1.15rem;
		margin-left: 0.3rem;
		letter-spacing: 0.02em;
		color: var(--textColor);
	}
	.foot {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.5rem;
		font-size: 1.05rem;
		line-height: 1.5;
		color: var(--subColor);
	}
	.delta {
		font-variant-numeric: tabular-nums;
	}
	.delta.up {
		color: #4d6b57;
	}
	.delta.down {
		color: #a3453a;
	}
	.vs,
	.sub {
		color: var(--subColor);
	}
	.sub {
		flex-basis: 100%;
	}

	.tone-good {
		border-color: #d5e0d7;
		background-color: #f8fbf8;
	}
	.tone-warn {
		border-color: #e8d3ae;
		background-color: #fdf9f2;
	}
	.tone-danger {
		border-color: #e5c8c2;
		background-color: #fdf5f3;
	}
	.tone-warn .value {
		color: #8a6224;
	}
	.tone-danger .value {
		color: #a3453a;
	}

	@media screen and (min-width: 900px) {
		.stat {
			padding: 2rem;
		}
		.value {
			font-size: 3rem;
		}
	}
</style>
