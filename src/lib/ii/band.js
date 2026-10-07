// The band's height, as a fraction of the viewport. The CSS in Band.svelte
// carries the same number; this is here so a page can decide the chrome's tone
// against it without guessing.
export const BAND_VH = 0.5;

/** True while the chrome is still over the band and should be set in white.
 *  Measured against the chrome's own height so the tone turns at the moment it
 *  leaves the band, not before. */
export function chromeOverBand() {
	const el = document.querySelector('.chrome');
	const h = el ? el.getBoundingClientRect().height : 90;
	return window.scrollY + h < window.innerHeight * BAND_VH;
}
