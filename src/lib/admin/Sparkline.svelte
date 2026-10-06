<script>
	// Single-series trend strip. One hue, 2px line, 10%-ish wash, end dot with a
	// surface ring. No axes — the number it sits beside carries the magnitude.
	export let data = [];
	export let height = 40;

	const PAD_X = 5;
	const PAD_Y = 5;

	let w = 240; // SSR fallback until clientWidth lands
	let hover = -1;

	$: rows = Array.isArray(data)
		? data.filter((d) => d && Number.isFinite(Number(d.value)))
		: [];
	$: cw = w > 0 ? w : 240;
	$: h = Math.max(20, Number(height) || 40);
	$: values = rows.map((d) => Number(d.value));
	$: vmin = values.length ? Math.min(...values) : 0;
	$: vmax = values.length ? Math.max(...values) : 0;
	$: pts = buildPoints(rows, cw, h, vmin, vmax);
	$: linePath = pts.length >= 2 ? 'M' + pts.map((p) => p.x + ',' + p.y).join(' L') : '';
	$: areaPath =
		pts.length >= 2
			? linePath + ' L' + pts[pts.length - 1].x + ',' + (h - 1) + ' L' + pts[0].x + ',' + (h - 1) + ' Z'
			: '';
	$: lastPt = pts.length ? pts[pts.length - 1] : null;
	$: slotW = pts.length ? cw / pts.length : 0;
	$: active = hover >= 0 && hover < pts.length ? hover : -1;
	$: tip = active >= 0 ? pts[active] : null;
	$: tipLeft = tip ? Math.min(Math.max(tip.x, 34), Math.max(34, cw - 34)) : 0;
	$: summary =
		rows.length > 0
			? '推移 ' +
				rows.length +
				'点、最小 ' +
				fmt(vmin) +
				'、最大 ' +
				fmt(vmax) +
				'、最新 ' +
				fmt(values[values.length - 1])
			: 'データがありません';

	function r2(v) {
		return Math.round(v * 100) / 100;
	}
	function fmt(v) {
		return Number(v ?? 0).toLocaleString('ja-JP');
	}
	function buildPoints(rs, width, hgt, lo, hi) {
		const n = rs.length;
		if (!n) return [];
		const x0 = PAD_X;
		const x1 = Math.max(x0 + 1, width - PAD_X);
		const yTop = PAD_Y;
		const yBot = Math.max(yTop + 1, hgt - PAD_Y);
		const span = hi - lo;
		return rs.map((d, i) => {
			const t = n === 1 ? 0.5 : i / (n - 1);
			const v = Number(d.value);
			const ratio = span === 0 ? 0.5 : (v - lo) / span;
			return {
				x: r2(x0 + t * (x1 - x0)),
				y: r2(yBot - ratio * (yBot - yTop)),
				v,
				date: d.date ?? ''
			};
		});
	}
</script>

<div class="spark" bind:clientWidth={w} style="height:{h}px">
	{#if rows.length === 0}
		<span class="none">データがありません</span>
	{:else}
		<svg
			width={cw}
			height={h}
			viewBox="0 0 {cw} {h}"
			role="img"
			aria-label={summary}
			on:mouseleave={() => (hover = -1)}
		>
			{#if areaPath}<path class="area" d={areaPath} />{/if}
			{#if linePath}<path class="line" d={linePath} />{/if}

			{#if lastPt}
				<circle class="dot" cx={lastPt.x} cy={lastPt.y} r="3.5" />
			{/if}

			{#if tip}
				<line class="cross" x1={tip.x} y1="0" x2={tip.x} y2={h} />
				<circle class="dot on" cx={tip.x} cy={tip.y} r="3.5" />
			{/if}

			{#each pts as p, i (i)}
				<rect
					class="hit"
					x={r2(i * slotW)}
					y="0"
					width={r2(slotW)}
					height={h}
					on:mouseenter={() => (hover = i)}
				/>
			{/each}
		</svg>

		{#if tip}
			<div class="tip" style="left:{tipLeft}px">
				<span class="tv">{fmt(tip.v)}</span>
				{#if tip.date}<span class="td">{tip.date}</span>{/if}
			</div>
		{/if}
	{/if}

	<!-- table twin: every value stays readable without hovering -->
	<table class="sr">
		<caption>推移データ</caption>
		<thead><tr><th>日付</th><th>値</th></tr></thead>
		<tbody>
			{#each rows as d, i (i)}
				<tr><td>{d.date ?? ''}</td><td>{fmt(d.value)}</td></tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	.spark {
		position: relative;
		width: 100%;
	}
	svg {
		display: block;
		overflow: visible;
	}
	.none {
		display: flex;
		align-items: center;
		height: 100%;
		font-size: 1rem;
		color: var(--subColor);
	}
	/* global `svg path { fill: … }` in base.css has to be out-specified here */
	.line {
		fill: none;
		stroke: var(--textColor);
		stroke-width: 2;
		stroke-linejoin: round;
		stroke-linecap: round;
	}
	.area {
		fill: rgba(72, 72, 72, 0.07);
		stroke: none;
	}
	.dot {
		fill: var(--blackColor);
		stroke: var(--backgroundColor);
		stroke-width: 2;
	}
	.cross {
		stroke: #d9d5d1;
		stroke-width: 1;
	}
	.hit {
		fill: transparent;
	}
	.tip {
		position: absolute;
		bottom: calc(100% + 0.6rem);
		transform: translateX(-50%);
		z-index: 5;
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
		padding: 0.4rem 0.7rem;
		background-color: #fff;
		border: 1px solid #eae7e4;
		border-radius: 2px;
		white-space: nowrap;
		pointer-events: none;
	}
	.tv {
		font-size: 1.1rem;
		line-height: 1.2;
		color: var(--blackColor);
		font-variant-numeric: tabular-nums;
	}
	.td {
		font-size: 0.95rem;
		line-height: 1.2;
		color: var(--subColor);
	}
	.sr {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip: rect(0 0 0 0);
		clip-path: inset(50%);
		white-space: nowrap;
	}
</style>
