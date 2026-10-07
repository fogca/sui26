<script>
	// A band of the water across the top of an inner page: full bleed, flush to
	// the top of the viewport, with the page's title set over it in white.
	//
	// The pale "breath" surface still runs behind the whole page; this sits on
	// top of it for its own height only. It carries .on-field, which is the same
	// switch the home page uses to turn the type and the rules white.
	//
	// BAND_VH below is the height, and the page that uses this has to start its
	// own content past it — see .ii-main's padding in the pages themselves. It
	// is also what the chrome's tone is decided against, so it is exported
	// rather than written twice.
	import Field from '$lib/ii/Field.svelte';
	import { SURFACE } from '$lib/ii/surface.js';
</script>

<div class="band on-field">
	<div class="water" aria-hidden="true"><Field study={SURFACE} /></div>
	<div class="inner"><slot /></div>
</div>

<style>
	.band {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		/* keep in step with BAND_VH in src/lib/ii/band.js */
		height: 50vh;
		/* over the page's own surface (0), under the chrome (10) */
		z-index: 1;
		overflow: hidden;
	}
	.water {
		position: absolute;
		inset: 0;
	}
	/* the title keeps the vertical rhythm it has everywhere else on the site,
	   which lands it inside the band at both widths */
	.inner {
		position: relative;
		padding: 141px var(--ii-gutter) 0;
	}
	@media screen and (min-width: 720px) {
		.inner {
			padding: 30vh var(--ii-gutter) 0;
		}
	}
</style>
