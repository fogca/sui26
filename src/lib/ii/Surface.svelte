<script>
	// The page surface: the water field, fixed behind everything.
	//
	// Fixed rather than scrolled, so a long page keeps one continuous field
	// instead of running off the bottom of it — and so the field costs the same
	// whatever the page's height.
	import Field from '$lib/ii/Field.svelte';
	import { SURFACE } from '$lib/ii/surface.js';

	/** SURFACE (water, white type) or BREATH (pale, ink type). */
	export let study = SURFACE;
	/** Blends the field toward the white page behind it. The shop pages carry
	 *  product photography, which wants a quieter ground than the field gives
	 *  at full strength. */
	export let opacity = 1;
</script>

<div class="surface" aria-hidden="true" style="--rest:{study.colors[2]};--op:{opacity}">
	<Field {study} />
</div>

<style>
	.surface {
		position: fixed;
		inset: 0;
		z-index: 0;
		pointer-events: none;
		/* the palette's mid tone, so the first paint before WebGL is ready is
		   already the right colour rather than white */
		background: var(--rest);
		/* As a property rather than an inline style: the home page's opening
		   raises the water behind the type, and an inline opacity cannot be
		   overridden by a rule. */
		opacity: var(--op, 1);
	}
</style>
