<script>
	// Single-series column chart. One hue for every column (no value-ramp on
	// nominal categories), thin marks, 2px surface gap, hairline baseline.
	// `height` is the PLOT height — the x-axis band is added on top of it so the
	// labels are never clipped by a fixed container.
	import { yen } from '$lib/shop/money.js';

	export let data = [];
	export let height = 180;
	export let format = 'plain';

	const PAD_TOP = 22; // room for the two direct labels
	const PAD_BOTTOM = 24; // x-axis band
	const MAX_BAR = 24;
	const GAP = 2;

	let w = 480; // SSR fallback until clientWidth lands
	let hover = -1;

	$: rows = Array.isArray(data)
		? data.filter((d) => d && Number.isFinite(Number(d.value)))
		: [];
	$: cw = w > 0 ? w : 480;
	$: plotH = Math.max(60, Number(height) || 180);
	$: svgH = plotH + PAD_TOP + PAD_BOTTOM;
	$: baseY = PAD_TOP + plotH;
	$: values = rows.map((d) => Number(d.value));
	$: peak = values.length ? Math.max(...values) : 0;
	$: scaleMax = niceMax(peak);
	$: slotW = rows.length ? cw / rows.length : 0;
	$: barW = Math.max(2, Math.min(MAX_BAR, slotW - GAP));
	$: bars = buildBars(rows, slotW, barW, plotH, scaleMax);
	$: maxIdx = values.length ? values.indexOf(peak) : -1;
	$: lastIdx = rows.length - 1;
	// direct-label the extreme and the latest, but only when both fit and do not
	// collide; everything else lives in the tooltip and the table twin
	$: labelIdx = pickLabels(bars, maxIdx, lastIdx, slotW);
	$: xStep = Math.max(1, Math.ceil(rows.length / Math.max(2, Math.floor(cw / 62))));
	$: active = hover >= 0 && hover < bars.length ? hover : -1;
	$: tip = active >= 0 ? bars[active] : null;
	$: tipLeft = tip ? Math.min(Math.max(tip.cx, 46), Math.max(46, cw - 46)) : 0;
	$: tipTop = tip ? Math.max(PAD_TOP, tip.y) : 0;

	function r2(v) {
		return Math.round(v * 100) / 100;
	}
	function fmt(v) {
		return format === 'yen' ? yen(v) : Number(v ?? 0).toLocaleString('ja-JP');
	}
	function niceMax(v) {
		if (!(v > 0)) return 1;
		const exp = Math.pow(10, Math.floor(Math.log10(v)));
		const f = v / exp;
		const m = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
		return m * exp;
	}
	function buildBars(rs, sw, bw, ph, max) {
		return rs.map((d, i) => {
			const v = Number(d.value);
			const bh = max > 0 ? Math.max(0, (v / max) * ph) : 0;
			const x = i * sw + (sw - bw) / 2;
			const y = PAD_TOP + ph - bh;
			return {
				i,
				v,
				label: String(d.label ?? ''),
				x: r2(x),
				y: r2(y),
				w: r2(bw),
				h: r2(bh),
				cx: r2(x + bw / 2),
				d: barPath(x, y, bw, bh, 4)
			};
		});
	}
	// square at the baseline, 4px rounded at the data end
	function barPath(x, y, bw, bh, r) {
		if (bh <= 0) return '';
		const rr = Math.max(0, Math.min(r, bw / 2, bh));
		const b = y + bh;
		return (
			'M' + r2(x) + ',' + r2(b) +
			' L' + r2(x) + ',' + r2(y + rr) +
			' Q' + r2(x) + ',' + r2(y) + ' ' + r2(x + rr) + ',' + r2(y) +
			' L' + r2(x + bw - rr) + ',' + r2(y) +
			' Q' + r2(x + bw) + ',' + r2(y) + ' ' + r2(x + bw) + ',' + r2(y + rr) +
			' L' + r2(x + bw) + ',' + r2(b) + ' Z'
		);
	}
	function fits(text, room) {
		return text.length * 5.8 <= room;
	}
	// keep a direct label inside the plot even when its bar sits at the edge
	function labelX(cx, text, width) {
		const half = (text.length * 5.8) / 2 + 2;
		return r2(Math.min(Math.max(cx, half), Math.max(half, width - half)));
	}
	function pickLabels(bs, mi, li, sw) {
		const out = [];
		if (mi < 0 || !bs.length) return out;
		if (fits(fmt(bs[mi].v), sw * 2)) out.push(mi);
		if (li !== mi && li >= 0 && bs[li] && Math.abs(li - mi) >= 2 && fits(fmt(bs[li].v), sw * 2)) {
			out.push(li);
		}
		return out;
	}
	function shortLabel(text, room) {
		const max = Math.max(2, Math.floor(room / 6));
		return text.length > max ? text.slice(0, max - 1) + '…' : text;
	}
</script>

<div class="chart" bind:clientWidth={w}>
	{#if rows.length === 0}
		<p class="none">データがありません</p>
	{:else}
		<svg
			width={cw}
			height={svgH}
			viewBox="0 0 {cw} {svgH}"
			role="img"
			aria-label="{rows.length}件の推移。最大 {fmt(peak)}"
			on:mouseleave={() => (hover = -1)}
		>
			<line class="base" x1="0" y1={baseY} x2={cw} y2={baseY} />

			{#each bars as b (b.i)}
				{#if b.d}
					<path class="bar" class:on={active === b.i} d={b.d} />
				{/if}
			{/each}

			{#each labelIdx as li (li)}
				<text
					class="vlab"
					x={labelX(bars[li].cx, fmt(bars[li].v), cw)}
					y={Math.max(12, bars[li].y - 7)}
					text-anchor="middle"
				>
					{fmt(bars[li].v)}
				</text>
			{/each}

			{#each bars as b (b.i)}
				{#if (bars.length - 1 - b.i) % xStep === 0}
					<text class="xlab" x={b.cx} y={baseY + 15} text-anchor="middle">
						{shortLabel(b.label, slotW * xStep)}
					</text>
				{/if}
			{/each}

			{#each bars as b (b.i)}
				<rect
					class="hit"
					x={r2(b.i * slotW)}
					y={PAD_TOP}
					width={r2(slotW)}
					height={plotH}
					on:mouseenter={() => (hover = b.i)}
				/>
			{/each}
		</svg>

		{#if tip}
			<div class="tip" style="left:{tipLeft}px; top:{tipTop}px">
				<span class="tv">{fmt(tip.v)}</span>
				{#if tip.label}<span class="tl">{tip.label}</span>{/if}
			</div>
		{/if}
	{/if}

	<!-- table twin: no value is gated behind a hover -->
	<table class="sr">
		<caption>グラフのデータ</caption>
		<thead><tr><th>項目</th><th>値</th></tr></thead>
		<tbody>
			{#each rows as d, i (i)}
				<tr><td>{d.label ?? ''}</td><td>{fmt(d.value)}</td></tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	.chart {
		position: relative;
		width: 100%;
	}
	svg {
		display: block;
		overflow: visible;
	}
	.none {
		font-size: 1.1rem;
		text-align: left;
		color: var(--subColor);
		padding: 3.2rem 0;
	}
	/* out-specify base.css `svg path { fill: var(--textColor) }` */
	.bar {
		fill: var(--textColor);
		fill-opacity: 0.5;
		stroke: none;
		transition: fill-opacity 0.16s ease;
	}
	.bar.on {
		fill: var(--blackColor);
		fill-opacity: 1;
	}
	.base {
		stroke: #e8e5e2;
		stroke-width: 1;
	}
	.hit {
		fill: transparent;
	}
	.vlab,
	.xlab {
		font-size: 10px;
		letter-spacing: 0.02em;
		font-variant-numeric: tabular-nums;
	}
	.vlab {
		fill: var(--textColor);
	}
	.xlab {
		fill: var(--subColor);
	}
	.tip {
		position: absolute;
		transform: translate(-50%, calc(-100% - 0.8rem));
		z-index: 5;
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		padding: 0.5rem 0.8rem;
		background-color: #fff;
		border: 1px solid #eae7e4;
		border-radius: 2px;
		white-space: nowrap;
		pointer-events: none;
	}
	.tv {
		font-size: 1.2rem;
		line-height: 1.3;
		color: var(--blackColor);
		font-variant-numeric: tabular-nums;
	}
	.tl {
		font-size: 1rem;
		line-height: 1.3;
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
