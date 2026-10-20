<script>
	// A horizontal strip of the work, moving under a fixed window.
	//
	// Measured from cathydolle.com (2026-08-14 at 1440x810, re-read 2026-10-20).
	// The reference runs the strip vertically and draws it in a single WebGL
	// canvas — no <img> in its DOM at all, every picture a texture. This is the
	// same motion rebuilt out of DOM transforms, turned on its side:
	//
	//  - Each picture is fitted into a box at its TRUE aspect. A landscape
	//    frame hits the width limit, a portrait one the height limit. Nothing
	//    is cropped and nothing is stretched, which is where the ragged
	//    silhouette comes from — the frames are not a grid.
	//  - The picture PARALLAXES inside its frame: it lags the frame's own
	//    displacement from the centre of the window by 6% of it, clamped so the
	//    picture never pulls away from its edges. The frame never changes size.
	//    (The reference runs about 10%, with the picture blown up well past the
	//    frame to afford it; 6% keeps the enlargement under a tenth.)
	//  - The scroll is free and wraps. The reference does not snap and neither
	//    does this: a throw spends itself and stops wherever it stops.
	//
	// Nothing here reads a library. The decay is written as pow(k, dt/16.7) so
	// the motion is the same on a 60Hz panel and a 120Hz one.
	import { onMount, onDestroy } from 'svelte';

	/** [{ image, text }] — one frame each, in order. */
	export let items = [];
	/** Take a plain vertical wheel and a vertical swipe as travel too. Only
	 *  true on a page that does not scroll: anywhere else it would trap the
	 *  reader on a strip that never ends. */
	export let takeVertical = false;

	/** How far the picture lags its frame, as a fraction of the frame's
	 *  displacement from the centre of the window. */
	const PARALLAX = 0.06;
	/** Half the picture's excess over its frame, as a fraction of the frame.
	 *  This is what the lag has to move within, so the two go together. */
	const REACH = 0.06;
	/** Between frames. The reference sets them edge to edge; a little air lets
	 *  each picture read on its own. */
	const GAP = 16;
	/** A size of its own for each frame in turn.
	 *
	 *  Fitting alone cannot make a strip ragged: whichever side of a picture
	 *  binds first gets pinned to the edge of the box, so a catalogue that is
	 *  mostly portraits comes out with nearly every frame at exactly the box's
	 *  height — measured here, six of nine sat on the same 347px. Giving each
	 *  frame its own share of the box breaks that, and it is a fixed sequence
	 *  rather than a random one so the strip is the same on every load and the
	 *  server renders what the client does. */
	const SCALES = [1, 0.7, 0.92, 0.58, 1, 0.76, 0.86, 0.64, 0.96];
	/** Wheel and drag are in different units; these bring both to px of travel. */
	const WHEEL = 0.9;
	const DRAG = 1.0;
	/** Per-frame velocity decay, quoted at 60Hz. */
	const DECAY = 0.92;

	let stage;
	let track;
	let reduced = false;

	/** The list actually laid out: the items repeated until the strip is long
	 *  enough to wrap without ever showing its end. */
	let run = [];

	let frames = [];
	let pics = [];
	/** { w, h, left, reach } in strip space, one per laid-out frame. */
	let geo = [];
	let total = 0;
	let vw = 0;
	let boxW = 0;
	let boxH = 0;

	let off = 0;
	let vel = 0;
	let raf = 0;
	let last = 0;
	let ready = false;
	let active = 0;

	const wrap = (v) => (total > 0 ? ((v % total) + total) % total : 0);
	/** The short way round, which is the only sensible reading of a difference
	 *  on a loop. */
	function wrapDelta(v) {
		let d = wrap(v);
		if (d > total / 2) d -= total;
		return d;
	}

	function measure() {
		if (!stage || !items.length) return;
		vw = stage.clientWidth;
		// The box every picture is fitted into. The reference's is 350 x 324 at
		// 1440 x 810 — very slightly landscape, and that is the whole trick: a
		// box taller than it is wide makes EVERY picture width-limited, so every
		// frame comes out the same width and the strip loses its rhythm along
		// the very axis it travels. Held at the reference's 1.08 and sized to
		// whichever of the two limits binds first.
		const BOX_ASPECT = 1.08;
		const widest = vw * (vw < 720 ? 0.70 : 0.30);
		boxW = Math.min(widest, stage.clientHeight * BOX_ASPECT);
		boxH = Math.min(stage.clientHeight, boxW / BOX_ASPECT);

		// The fit is solved from the files' own sizes, which the data carries, so
		// none of this waits on a picture to decode — and in a strip that wraps,
		// most frames are off screen most of the time.
		const fit = (src, i) => {
			const nw = src.w || 4;
			const nh = src.h || 5;
			const share = SCALES[i % SCALES.length];
			const k = Math.min((boxW * share) / nw, (boxH * share) / nh);
			return { w: Math.round(nw * k), h: Math.round(nh * k) };
		};

		// Repeat the list until the strip is comfortably longer than the window.
		// Measured from the real fitted widths rather than from the box: the box
		// is only the widest a frame may be, and a run of portraits comes out
		// far narrower than it, which is exactly when a hole would open on the
		// way round.
		const unit = items.reduce((sum, it, i) => sum + fit(it, i).w + GAP, 0);
		const copies = Math.max(1, Math.ceil((vw * 2) / Math.max(1, unit)));
		if (copies * items.length !== run.length) {
			const next = [];
			for (let c = 0; c < copies; c++) next.push(...items);
			run = next;
			return; // the DOM has to catch up before anything can be measured
		}

		frames = track ? [...track.querySelectorAll('.frame')] : [];
		pics = frames.map((f) => f.querySelector('img'));

		let x = 0;
		geo = frames.map((f, i) => {
			const { w, h } = fit(run[i] || {}, i);
			const g = { w, h, left: x, reach: REACH * w };
			x += w + GAP;
			return g;
		});
		total = x;
		ready = total > 0;
		place();
	}

	/** Which frame is nearest the centre of the window — the one the name is
	 *  read from. */
	function activeIndex() {
		const centre = wrap(off + vw / 2);
		let best = 0;
		let bestD = Infinity;
		for (let i = 0; i < geo.length; i++) {
			const d = Math.abs(wrapDelta(geo[i].left + geo[i].w / 2 - centre));
			if (d < bestD) {
				bestD = d;
				best = i;
			}
		}
		return best;
	}

	function place() {
		if (!ready) return;
		const half = vw / 2;
		for (let i = 0; i < frames.length; i++) {
			const g = geo[i];
			// the representative of this frame nearest the window, so a frame
			// that has gone off one end comes back on the other
			let x = g.left - off;
			x = wrap(x + total / 2) - total / 2;
			if (x > total / 2) x -= total;

			frames[i].style.width = g.w + 'px';
			frames[i].style.height = g.h + 'px';
			frames[i].style.transform = `translate3d(${x.toFixed(2)}px, 0, 0)`;

			// the picture lags the frame's displacement from the centre
			const mid = x + g.w / 2;
			const lag = Math.max(-g.reach, Math.min(g.reach, -PARALLAX * (mid - half)));
			if (pics[i]) pics[i].style.transform = `translate3d(${lag.toFixed(2)}px, 0, 0)`;
		}
		const a = activeIndex();
		if (a !== active) active = a;
	}

	function tick(ts) {
		const dt = last ? Math.min(50, ts - last) : 16.7;
		last = ts;
		if (!dragging) {
			off += vel * (dt / 16.7) * 0.1;
			vel *= Math.pow(DECAY, dt / 16.7);
			if (Math.abs(vel) < 0.02) vel = 0;
		}
		off = wrap(off);
		place();
		raf = requestAnimationFrame(tick);
	}

	function onWheel(e) {
		if (reduced) return;
		// A trackpad's sideways swipe, and shift+wheel, which the browser already
		// reports as deltaX. A plain vertical wheel is only taken where the page
		// has nothing to scroll to — the strip wraps, so taking it on a page that
		// scrolls would trap the reader on a section that never ends.
		const sideways = Math.abs(e.deltaX) > Math.abs(e.deltaY);
		if (!sideways && !takeVertical) return;
		const d = sideways ? e.deltaX : e.deltaY;
		if (!d) return;
		e.preventDefault();
		vel += d * WHEEL;
	}

	let dragging = false;
	let pointerId = null;
	let downX = 0;
	let lastX = 0;
	let captured = false;

	function onDown(e) {
		if (reduced || e.button > 0) return;
		pointerId = e.pointerId;
		downX = lastX = e.clientX;
		dragging = true;
		vel = 0;
	}

	function onMove(e) {
		if (!dragging || e.pointerId !== pointerId) return;
		const dx = e.clientX - lastX;
		lastX = e.clientX;
		// Capture only once the gesture is clearly a drag. Taking the pointer on
		// down retargets the click to this element and kills the links.
		if (!captured && Math.abs(e.clientX - downX) > 4) {
			captured = true;
			stage.setPointerCapture(pointerId);
		}
		if (!captured) return;
		off = wrap(off - dx * DRAG);
		vel = -dx * DRAG * 1.6;
		place();
	}

	function onUp(e) {
		if (!dragging) return;
		if (captured && stage.hasPointerCapture?.(pointerId)) stage.releasePointerCapture(pointerId);
		dragging = false;
		captured = false;
		pointerId = null;
	}

	/** A drag must not also open the link it finished on. */
	function onClick(e) {
		if (Math.abs(e.clientX - downX) > 4) {
			e.preventDefault();
			e.stopPropagation();
		}
	}

	let ro;

	onMount(() => {
		reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		measure();
		// naturalWidth is 0 until each picture has decoded, so the fit is solved
		// again as they arrive rather than once and wrongly
		for (const im of pics) {
			if (im && !im.complete) im.addEventListener('load', measure, { once: true });
		}
		ro = new ResizeObserver(measure);
		ro.observe(stage);
		if (!reduced) raf = requestAnimationFrame(tick);
		return () => {
			ro.disconnect();
			cancelAnimationFrame(raf);
		};
	});

	// the run grows in measure(); when it does, the DOM needs a pass before the
	// new frames can be measured
	$: if (run.length) queueMicrotask(() => measure());

	onDestroy(() => {
		if (typeof window === 'undefined') return;
		cancelAnimationFrame(raf);
	});

	$: run = run.length ? run : items;
	$: name = run.length ? run[active % run.length]?.text : '';
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="stage"
	class:is-ready={ready}
	style="--strip-touch:{takeVertical ? 'none' : 'pan-y'}"
	bind:this={stage}
	on:wheel={onWheel}
	on:pointerdown={onDown}
	on:pointermove={onMove}
	on:pointerup={onUp}
	on:pointercancel={onUp}
	on:click={onClick}
>
	<div class="track" bind:this={track}>
		{#each run as w, i (i)}
			<figure class="frame">
				<img src={w.image} alt={w.text} loading={i < 4 ? 'eager' : 'lazy'} draggable="false" />
			</figure>
		{/each}
	</div>

	<!-- the one on the centre line, named -->
	<p class="name ii-jp" lang="ja" aria-live="off">{name}</p>
</div>

<style>
	.stage {
		/* fills whatever box the page gives it; the frames sit on its centre
		   line, so Y-centring is the page's to decide */
		position: absolute;
		inset: 0;
		overflow: hidden;
		cursor: grab;
		touch-action: var(--strip-touch, pan-y);
		opacity: 0;
		transition: opacity 0.8s ease;
	}
	.stage.is-ready {
		opacity: 1;
	}
	.stage:active {
		cursor: grabbing;
	}

	.track {
		position: absolute;
		inset: 0;
	}

	.frame {
		position: absolute;
		/* the frames are centred across the travel axis, so the strip reads as
		   one band however ragged the widths are */
		top: 50%;
		left: 0;
		margin: 0;
		transform-origin: 50% 50%;
		translate: 0 -50%;
		overflow: hidden;
		background: #eef2f3;
	}
	.frame img {
		/* oversized by twice the reach, which is the room the lag moves in */
		width: calc(100% + 12%);
		height: 100%;
		margin-left: -6%;
		object-fit: cover;
		user-select: none;
		-webkit-user-drag: none;
	}

	/* the one on the centre line, named — opposite the page's own title, which
	   sits in the other corner */
	.name {
		position: absolute;
		right: var(--ii-gutter);
		bottom: calc(24px + env(safe-area-inset-bottom));
		margin: 0;
	}

	@media (prefers-reduced-motion: reduce) {
		.stage {
			overflow-x: auto;
			scroll-snap-type: x mandatory;
			cursor: auto;
		}
	}
</style>
