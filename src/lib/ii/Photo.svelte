<script>
	// The single 1200x1800 source photograph. Every page in this direction is a
	// different window onto the same file — that is how the Figma frames were
	// built (identical image bytes, different crop), so no page ships its own
	// export.
	//
	// `sp` / `pc` each take either a window, {w, x, y} in multiples of the
	// viewport width exactly as Figma states it, or a position string for
	// object-fit: cover. A literal window keeps the composition intact on the
	// 393pt artboard; cover is the right answer on wide screens, where the same
	// window would need a 3000px-tall image to fill the viewport.
	export let sp = '50% 50%';
	export let pc = '50% 50%';
	/** Wash over the photo so pale type stays legible where it overlaps. */
	export let veil = 0;

	const win = (v) => v && typeof v === 'object';

	$: style = [
		win(sp)
			? `--sp-w:${sp.w};--sp-x:${sp.x};--sp-y:${sp.y}`
			: `--sp-pos:${sp}`,
		win(pc)
			? `--pc-w:${pc.w};--pc-x:${pc.x};--pc-y:${pc.y}`
			: `--pc-pos:${pc}`
	].join(';');
</script>

<div
	class="ii-photo"
	class:sp-bleed={win(sp)}
	class:sp-cover={!win(sp)}
	class:pc-bleed={win(pc)}
	class:pc-cover={!win(pc)}
	{style}
>
	<picture>
		<source srcset="/ii/scent.webp" type="image/webp" />
		<img src="/ii/scent.jpg" alt="" />
	</picture>
	{#if veil}
		<span class="veil" style="opacity:{veil}"></span>
	{/if}
</div>

<style>
	/* picture is a plain wrapper; the img is positioned by ii.css */
	.ii-photo :global(picture) {
		display: contents;
	}
</style>
