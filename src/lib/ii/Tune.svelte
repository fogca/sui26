<script>
	// Colour bar for judging the palette on the real page. Mounted when the URL
	// carries ?tune and kept for the rest of the tab session, so following a
	// link does not drop it. ?tune=off puts it away.
	//
	// Rendered outside .ii so none of the direction's own type rules reach it.
	// It writes straight to the live WebGL uniforms, to --ii-ink and to the
	// surface's opacity. Nothing here is read back by the site: a value worth
	// keeping has to be written into src/lib/ii/surface.js or static/css/ii.css
	// by hand. The bar is a way of looking, not a setting.
	import { onMount } from 'svelte';
	import { afterNavigate } from '$app/navigation';

	const KEY = 'sui-tune';
	/** ii.css's own ink, so Reset has something to go back to. */
	const INK = '#536774';

	const hexToRgb = (h) => [
		parseInt(h.slice(1, 3), 16),
		parseInt(h.slice(3, 5), 16),
		parseInt(h.slice(5, 7), 16)
	];

	const rgbToHex = (c) =>
		'#' +
		c
			.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0'))
			.join('');

	/** Where each of a study's stops sits between its two ends, channel by
	 *  channel. The water ramp is not a straight line — red and green fall away
	 *  faster at the light end than blue does — so re-spanning this shape is
	 *  what keeps the surface's character when only the ends are moved. A plain
	 *  interpolation between two colours is a different surface. */
	function shapeOf(stops) {
		const a = hexToRgb(stops[0]);
		const b = hexToRgb(stops[stops.length - 1]);
		return stops.map((s, i) =>
			hexToRgb(s).map((ch, c) => {
				const span = b[c] - a[c];
				return span === 0 ? i / (stops.length - 1) : (ch - a[c]) / span;
			})
		);
	}

	/** Rebuild the full ramp from two ends. With the study's own ends this
	 *  returns the study's own stops, exactly. */
	function ramp(paleHex, deepHex, shape) {
		const a = hexToRgb(paleHex);
		const b = hexToRgb(deepHex);
		return shape.map((f) => rgbToHex(f.map((t, c) => a[c] + t * (b[c] - a[c]))));
	}

	/** id of the field mounted on this page — SURFACE and BREATH are tuned
	 *  separately, since different pages carry different ones. */
	let id = '';
	let pale = '';
	let deep = '';
	let shape = [];
	/** the study's own ends, for Reset */
	let ends = ['', ''];
	let ink = INK;
	let opacity = 1;
	let open = true;
	/** Each page sets its own surface opacity, so the slider only takes over
	 *  once it has actually been moved on this page. */
	let touched = false;

	/** tuned ends per study id, kept across navigations and reloads */
	let store = {};

	$: stops = shape.length && pale && deep ? ramp(pale, deep, shape) : [];

	function load() {
		try {
			const raw = sessionStorage.getItem(KEY);
			if (!raw) return;
			const s = JSON.parse(raw);
			store = s.store || {};
			ink = s.ink || INK;
		} catch {
			// a debug bar is not worth a broken page
		}
	}

	function save() {
		try {
			sessionStorage.setItem(KEY, JSON.stringify({ store, ink }));
		} catch {
			// private mode: tuning simply does not survive a reload
		}
	}

	function field() {
		const all = (typeof window !== 'undefined' && window.__fields) || {};
		const key = Object.keys(all)[0];
		return key ? { key, api: all[key] } : null;
	}

	function apply() {
		const f = field();
		if (f && stops.length) f.api.setColors(stops);
		const root = document.querySelector('.ii');
		if (root) root.style.setProperty('--ii-ink', ink);
		if (touched) {
			const surface = document.querySelector('.surface');
			if (surface) surface.style.opacity = String(opacity);
		}
	}

	/** The page's field is mounted by the time afterNavigate runs, but the very
	 *  first paint can land either way round — so retry for a few frames rather
	 *  than giving up on an empty registry. */
	function attach(tries = 0) {
		const f = field();
		if (!f) {
			if (tries < 30) requestAnimationFrame(() => attach(tries + 1));
			return;
		}
		id = f.key;
		const own = f.api.colors;
		shape = shapeOf(own);
		ends = [own[0], own[own.length - 1]];
		const tuned = store[id];
		pale = tuned ? tuned[0] : ends[0];
		deep = tuned ? tuned[1] : ends[1];
		// the page decides its own opacity; the slider starts where it is
		const surface = document.querySelector('.surface');
		opacity = surface ? parseFloat(getComputedStyle(surface).opacity) || 1 : 1;
		touched = false;
		apply();
	}

	function onEnd(which, value) {
		if (which === 'pale') pale = value;
		else deep = value;
		store[id] = [pale, deep];
		save();
		apply();
	}

	function onInk(value) {
		ink = value;
		save();
		apply();
	}

	function onOpacity(value) {
		opacity = parseFloat(value);
		touched = true;
		apply();
	}

	function reset() {
		pale = ends[0];
		deep = ends[1];
		delete store[id];
		ink = INK;
		touched = false;
		save();
		const surface = document.querySelector('.surface');
		if (surface) surface.style.removeProperty('opacity');
		apply();
	}

	$: snippet = id
		? `${id}.colors = ['${stops.join("', '")}']   // ${pale} → ${deep}\n--ii-ink: ${ink};\nopacity: ${opacity}`
		: '';

	let copied = false;
	let copyTimer = 0;

	function copy() {
		navigator.clipboard?.writeText(snippet).then(
			() => {
				copied = true;
				clearTimeout(copyTimer);
				copyTimer = setTimeout(() => (copied = false), 1600);
			},
			() => {}
		);
	}

	onMount(() => {
		load();
		attach();
		return () => clearTimeout(copyTimer);
	});

	// the layout rebuilds the page subtree on every navigation, which destroys
	// the field and builds a fresh one with the study's own colours
	afterNavigate(() => attach());
</script>

<div class="tune" class:shut={!open}>
	<button class="toggle" type="button" on:click={() => (open = !open)}>
		{open ? '×' : '◐'}
	</button>

	{#if open}
		<div class="body">
			<div class="row">
				<span class="name">{id || 'no field'}</span>

				<label class="swatch">
					<input type="color" value={pale} on:input={(e) => onEnd('pale', e.currentTarget.value)} />
					<span class="hex">pale {pale}</span>
				</label>

				<label class="swatch">
					<input type="color" value={deep} on:input={(e) => onEnd('deep', e.currentTarget.value)} />
					<span class="hex">deep {deep}</span>
				</label>

				<span class="ramp" aria-hidden="true">
					{#each stops as s}
						<i style="background:{s}"></i>
					{/each}
				</span>
			</div>

			<div class="row">
				<span class="name">ink</span>
				<label class="swatch">
					<input type="color" value={ink} on:input={(e) => onInk(e.currentTarget.value)} />
					<span class="hex">{ink}</span>
				</label>

				<span class="name">opacity</span>
				<input
					class="range"
					type="range"
					min="0"
					max="1"
					step="0.05"
					value={opacity}
					on:input={(e) => onOpacity(e.currentTarget.value)}
				/>
				<span class="hex">{opacity}</span>

				<button class="act" type="button" on:click={copy}>{copied ? 'copied' : 'copy'}</button>
				<button class="act" type="button" on:click={reset}>reset</button>
			</div>
		</div>
	{/if}
</div>

<style>
	.tune {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 9999;
		display: flex;
		align-items: flex-start;
		gap: 8px;
		padding: 8px 10px calc(8px + env(safe-area-inset-bottom));
		background: rgba(18, 22, 26, 0.88);
		backdrop-filter: blur(8px);
		color: #fff;
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: 10px;
		line-height: 1.6;
		letter-spacing: 0;
	}
	.tune.shut {
		left: auto;
		right: 0;
		background: rgba(18, 22, 26, 0.7);
		padding: 6px;
	}
	.body {
		display: flex;
		flex-direction: column;
		gap: 6px;
		min-width: 0;
	}
	.row {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
	}
	.name {
		opacity: 0.6;
		white-space: nowrap;
	}
	.swatch {
		display: flex;
		align-items: center;
		gap: 4px;
		cursor: pointer;
	}
	.swatch input {
		width: 26px;
		height: 20px;
		padding: 0;
		border: 1px solid rgba(255, 255, 255, 0.35);
		background: none;
		cursor: pointer;
	}
	.hex {
		opacity: 0.75;
		white-space: nowrap;
	}
	/* the derived ramp, so the two ends can be judged as the four stops the
	   shader is actually given */
	.ramp {
		display: flex;
		border: 1px solid rgba(255, 255, 255, 0.25);
	}
	.ramp i {
		width: 16px;
		height: 18px;
	}
	.range {
		width: 90px;
	}
	.act,
	.toggle {
		border: 1px solid rgba(255, 255, 255, 0.35);
		background: none;
		color: #fff;
		font: inherit;
		padding: 2px 7px;
		cursor: pointer;
	}
	.toggle {
		padding: 2px 6px;
		line-height: 1.4;
	}
</style>
