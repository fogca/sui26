// The site's own field — the surface every public page sits on.
//
// It is the /lab/field "water" study pushed into its deeper register and
// magnified, which is what the Figma frames (128:260 / 128:264 / 128:284) are
// built on: a screenshot of that study, scaled 2.33x and mirrored so the deep
// end falls at the upper left and the pale passage at the lower right.
//
// Matched to the frames by measurement rather than by eye — sampling them gives
// a luminance spread of 148 / 186 / 226 at the 5th, 50th and 95th percentiles,
// a deepest value around #7d8fa8 and a palest around #e6ebf0.

export const SURFACE = {
	id: 'surface',
	ja: '水',
	en: 'Water',
	// Derived from the frames, not picked: the palette is solved backwards from
	// their luminance percentiles through this shader's own four-stop mix, so
	// f=0.05 lands near 226, f=0.50 near 186 and f=0.95 near 148.
	colors: ['#dadfe6', '#b4c0cf', '#94a4ba', '#808fa8'],
	scale: 0.8,
	// the frames magnify the study 2.33x; at 1.0 the shapes read far too small
	zoom: 2.3,
	warp: 2.2,
	drift: [-0.009, 0.006],
	// 135 degrees: the ramp runs deep at the upper left, pale at the lower right
	tilt: 2.36,
	contrast: 2.0,
	sweep: 0.5,
	// brings the median of the field onto the middle of the palette
	bias: 0.15,
	speed: 0.4
};
