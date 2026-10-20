// Collaboration credits, shared between the home intro loop and /works.
//
// w/h are the files' true pixel sizes. /works lays its strip out from these
// rather than from naturalWidth, so the frames are the right shape before a
// single picture has decoded — a strip that wraps cannot wait on loading to
// know how wide its own frames are.
export const works = [
	{ image: '/images/hanaori_1.jpg', w: 1080, h: 1618, text: '森岡書店' },
	{ image: '/images/senn15.jpg', w: 450, h: 600, text: 'SENN' },
	{ image: '/images/senn7.jpg', w: 800, h: 1000, text: 'SENN' },
	{ image: '/images/hermes.jpg', w: 1200, h: 802, text: 'HERMES skills academy' },
	{ image: '/images/lanuit.jpg.webp', w: 1350, h: 1350, text: 'La Nuit' },
	{ image: '/images/moriokasyoten2023.jpg', w: 3596, h: 5394, text: '森岡書店' },
	{ image: '/images/MIM.jpeg', w: 2784, h: 1440, text: 'MIM' },
	{ image: '/images/roka.jpg', w: 1179, h: 1179, text: '直島旅館ろ霞' },
	{ image: '/images/MARUYOHOTEL.jpg', w: 1365, h: 2048, text: 'MARUYO HOTEL' },
	{ image: '/images/happymouth.jpg', w: 4000, h: 6000, text: 'Happy mouth' },
	{ image: '/images/sari.jpg', w: 863, h: 1280, text: 'SUI scent by Sari' }
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
