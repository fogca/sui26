<script>
	// The page surface: the water field, fixed behind everything.
	//
	// Fixed rather than scrolled, so a long page keeps one continuous field
	// instead of running off the bottom of it — and so the field costs the same
	// whatever the page's height.
	import Field from '$lib/ii/Field.svelte';
	import { SURFACE } from '$lib/ii/surface.js';
</script>

<div class="surface" aria-hidden="true">
	<Field study={SURFACE} />
</div>

<style>
	.surface {
		position: fixed;
		inset: 0;
		z-index: 0;
		pointer-events: none;
		/* the palette's mid tone, so the first paint before WebGL is ready is
		   already the right colour rather than white */
		background: #a7b5c7;
	}
</style>
