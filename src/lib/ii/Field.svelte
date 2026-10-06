<script>
	// One drifting colour field. The work is in src/lib/ii/field.js; this is
	// the canvas around it — sizing, and the rules about when it is allowed to
	// run at all.
	//
	// It stops whenever it is off screen or the tab is hidden, and it renders a
	// single frame and stops for anyone who asks for reduced motion. A
	// background that costs a laptop its battery is not a calm background.
	import { onMount, onDestroy } from 'svelte';
	import { createField } from '$lib/ii/field.js';

	export let study;
	/** Devicepixel cap. The field has no edges, so there is nothing for extra
	 *  resolution to sharpen — 1.25 is indistinguishable from 2 and much
	 *  cheaper on a phone. */
	export let dpr = 1.25;

	let canvas;
	let box;
	let failed = false;

	let field = null;
	let frame = 0;
	let running = false;
	let visible = true;
	let started = 0;
	let painted = 0;
	let elapsed = 0; // field time survives a pause, so it never jumps
	let reduced = false;

	// The field changes by about three 8-bit levels in ten seconds. Painting it
	// at a 120Hz display's full rate is four times the work for a difference
	// nobody can see, and this is meant to sit behind a whole site.
	const MIN_FRAME_MS = 1000 / 30;

	function draw(now) {
		frame = requestAnimationFrame(draw);
		// time advances with the wall clock even on skipped frames, so capping
		// the paint rate never slows the drift down
		elapsed += (now - started) / 1000;
		started = now;
		if (now - painted < MIN_FRAME_MS) return;
		painted = now;
		field.renderAt(elapsed);
	}

	function start() {
		if (running || !field || reduced) return;
		running = true;
		started = performance.now();
		painted = 0;
		frame = requestAnimationFrame(draw);
	}

	function stop() {
		running = false;
		cancelAnimationFrame(frame);
	}

	function sync() {
		if (visible && !document.hidden) start();
		else stop();
	}

	function measure() {
		if (!field || !box) return;
		const r = box.getBoundingClientRect();
		field.resize(r.width, r.height, Math.min(window.devicePixelRatio || 1, dpr));
		if (!running) field.renderAt(elapsed);
	}

	onMount(() => {
		field = createField(canvas, study);
		if (!field) {
			failed = true;
			return;
		}

		reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		measure();
		field.renderAt(elapsed);

		const ro = new ResizeObserver(measure);
		ro.observe(box);

		const io = new IntersectionObserver(
			(entries) => {
				visible = entries[0].isIntersecting;
				sync();
			},
			{ rootMargin: '120px' }
		);
		io.observe(box);

		document.addEventListener('visibilitychange', sync);

		// Deterministic capture hook: the field never reads the clock itself, so
		// a given t always draws the same frame. Lets a screenshot be compared
		// against another run instead of catching whatever rAF happened to be on.
		window.__fields = window.__fields || {};
		window.__fields[study.id] = {
			renderAt: (t) => {
				stop();
				elapsed = t;
				field.renderAt(t);
			},
			resume: () => {
				sync();
			}
		};

		sync();

		return () => {
			ro.disconnect();
			io.disconnect();
			document.removeEventListener('visibilitychange', sync);
			if (window.__fields) delete window.__fields[study.id];
		};
	});

	onDestroy(() => {
		// onDestroy also runs on the server, where there is no rAF and nothing
		// was ever created. `field` is only ever set in onMount, so it is the
		// honest test for "there is something to tear down".
		if (!field) return;
		stop();
		field.destroy();
	});
</script>

<div class="field" bind:this={box} style="--fallback:{study.colors[1]}">
	<canvas bind:this={canvas} aria-hidden="true"></canvas>
	{#if failed}
		<!-- no WebGL: the mid tone of the same palette, which is what the field
		     averages to anyway -->
		<span class="sr" lang="en">Static fallback</span>
	{/if}
</div>

<style>
	.field {
		position: absolute;
		inset: 0;
		overflow: hidden;
		background: var(--fallback);
	}
	canvas {
		display: block;
		width: 100%;
		height: 100%;
	}
	.sr {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}
</style>
