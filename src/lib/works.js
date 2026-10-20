// Collaboration credits, shared between the home intro loop and /works.
//
// w/h are the files' true pixel sizes. /works lays its strip out from these
// rather than from naturalWidth, so the frames are the right shape before a
// single picture has decoded — a strip that wraps cannot wait on loading to
// know how wide its own frames are.
//
// WebP, capped at 1800px on the long edge: 6.19 MB of JPEG became 0.48 MB.
// The strip's box is about a quarter of the viewport, so the largest a frame
// is ever drawn is ~1330px on a 2560 screen at 2x — one of these files was
// 6000px tall. The originals are kept; /log still reads some of them.
export const works = [
	{ image: '/images/hanaori_1.webp', w: 1080, h: 1618, text: '森岡書店' },
	{ image: '/images/senn15.webp', w: 450, h: 600, text: 'SENN' },
	{ image: '/images/senn7.webp', w: 800, h: 1000, text: 'SENN' },
	{ image: '/images/hermes.webp', w: 1200, h: 802, text: 'HERMES skills academy' },
	{ image: '/images/lanuit.webp', w: 1350, h: 1350, text: 'La Nuit' },
	{ image: '/images/moriokasyoten2023.webp', w: 1200, h: 1800, text: '森岡書店' },
	{ image: '/images/MIM.webp', w: 1800, h: 931, text: 'MIM' },
	{ image: '/images/roka.webp', w: 1179, h: 1179, text: '直島旅館ろ霞' },
	{ image: '/images/MARUYOHOTEL.webp', w: 1200, h: 1800, text: 'MARUYO HOTEL' },
	{ image: '/images/happymouth.webp', w: 1200, h: 1800, text: 'Happy mouth' },
	{ image: '/images/sari.webp', w: 863, h: 1280, text: 'SUI scent by Sari' }
];

const CONTACT_TO = 'hello@sari-scent.jp';

const CONTACT_BODY = {
	ja: {
		subject: 'SUI scent studioへのお問い合わせ',
		body: 'SUI scent studioにご興味を持っていただきありがとうございます。\n\nSUIでは、香りにまつわるプロダクトのディレクションや製作を行っております。\n以下より情報をご入力いただきお送りください。\n新たなコラボレーションを楽しみにしております。\n\nご氏名：\nメールアドレス：\nお問い合わせ内容：'
	},
	en: {
		subject: 'Enquiry — SUI scent studio',
		body: 'Thank you for your interest in SUI scent studio.\n\nWe direct and create scent-related products and hold scent gatherings.\nPlease fill in the details below and send this message.\nWe look forward to new collaborations.\n\nName:\nEmail:\nYour enquiry:'
	}
};

/** mailto: link with the draft written in the reader's language. */
export function contactMailto(lang) {
	const c = CONTACT_BODY[lang === 'en' ? 'en' : 'ja'];
	return `mailto:${CONTACT_TO}?subject=${encodeURIComponent(c.subject)}&body=${encodeURIComponent(c.body)}`;
}

/** Japanese default, kept for callers that have no language in scope. */
export const contactHref = contactMailto('ja');
