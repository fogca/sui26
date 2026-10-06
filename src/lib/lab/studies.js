// Five colour studies for the drifting field. Each is a palette plus the four
// numbers that give it its own weather: how large the shapes are, how far the
// plane folds, which way it travels and how fast.
//
// Every palette is built from colours that exist in daylight — haze, water,
// cedar, early sun, breath on glass — and all of them stay inside the brand's
// own range: ink #536774 at the darkest, pale #e9f0f5 at the lightest.
//
// speed is in field-seconds per real second. Measured rather than guessed: at
// 0.05 the field changed by less than one 8-bit level in ten seconds, which is
// indistinguishable from a still image. These values move a fold roughly a
// fifth of the panel in half a minute — you cannot catch it moving, but look
// away and back and it has gone somewhere else.

export const STUDIES = [
	{
		id: 'mist',
		ja: '霧',
		en: 'Mist',
		note: '淡い藍と灰。朝の湿度',
		colors: ['#eef3f5', '#d8e4e9', '#aac4cd', '#80a2af'],
		scale: 0.85,
		warp: 1.7,
		drift: [0.012, -0.004],
		tilt: -0.5,
		contrast: 2.9,
		sweep: 0.45,
		speed: 0.42
	},
	{
		id: 'water',
		ja: '水',
		en: 'Water',
		note: '深みのある藍。水面の折り返し',
		colors: ['#e9eff4', '#bbccdb', '#8099b4', '#5b7591'],
		scale: 0.8,
		warp: 2.2,
		drift: [-0.009, 0.006],
		tilt: 0.35,
		contrast: 3.2,
		sweep: 0.4,
		speed: 0.4
	},
	{
		id: 'forest',
		ja: '杜',
		en: 'Forest',
		note: 'ブランドの緑。檜と苔',
		colors: ['#eff2ec', '#d2ddd2', '#a6bca8', '#77937e'],
		scale: 0.9,
		warp: 1.5,
		drift: [0.006, 0.011],
		tilt: -1.1,
		contrast: 2.7,
		sweep: 0.35,
		speed: 0.34
	},
	{
		id: 'dawn',
		ja: '暁',
		en: 'Dawn',
		note: '温かい灰と砂。日の差す前',
		colors: ['#f7f2ed', '#ecdfd5', '#d9c4b6', '#b89e91'],
		scale: 1.0,
		warp: 1.2,
		drift: [0.014, 0.0],
		tilt: 0.08,
		contrast: 2.4,
		sweep: 0.5,
		speed: 0.38
	},
	{
		id: 'breath',
		ja: '息',
		en: 'Breath',
		note: 'ほとんど白。文字がいちばん読みやすい',
		colors: ['#f8f9f9', '#eff2f3', '#e2e9eb', '#d3dde0'],
		scale: 0.7,
		warp: 1.7,
		drift: [0.01, -0.006],
		tilt: -0.25,
		contrast: 2.2,
		sweep: 0.55,
		speed: 0.55
	}
];
