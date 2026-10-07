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
	// Back to the /lab/field "water" study's own palette, which is where this
	// surface started. It went deeper three times on the way here; the studio
	// asked for the lab's colour again. The other numbers below are still the
	// site's, not the study's, so the two do not render identically — see the
	// bias note.
	colors: ['#e9eff4', '#bbccdb', '#8099b4', '#5b7591'],
	scale: 0.8,
	// the frames magnify the study 2.33x; at 1.0 the shapes read far too small
	zoom: 2.3,
	warp: 2.2,
	drift: [-0.02, 0.013],
	// 135 degrees: the ramp runs deep at the upper left, pale at the lower right
	tilt: 2.36,
	contrast: 2.0,
	sweep: 0.5,
	// Depth comes from the palette, not from pushing the field hard against the
	// end of it: at 0.32 large areas clamped on c3 and the median swung from
	// 149 to 114 as the field drifted. 0.20 keeps the spread steady.
	bias: 0.2,
	// fast enough that the movement reads, slow enough that it cannot be followed
	speed: 0.85
};

// The pale surface, for the pages that are there to be read — Works,
// Fragrance, log, Contact. It is the /lab/field "breath" study, magnified to
// match the water surface so the two feel like one family, and left light
// enough that ink type sits on it without any veil.
export const BREATH = {
	id: 'breath-surface',
	ja: '息',
	en: 'Breath',
	colors: ['#f7f9f9', '#edf1f2', '#dde5e8', '#cbd6da'],
	scale: 0.7,
	zoom: 2.3,
	warp: 1.7,
	drift: [0.01, -0.006],
	tilt: -0.25,
	contrast: 2.2,
	sweep: 0.55,
	bias: 0.0,
	speed: 0.55
};

