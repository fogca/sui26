// Collaboration credits, shared between the home intro loop and /works.
export const works = [
	{ image: '/images/hanaori_1.jpg', text: '森岡書店' },
	{ image: '/images/senn15.jpg', text: 'SENN' },
	{ image: '/images/senn7.jpg', text: 'SENN' },
	{ image: '/images/hermes.jpg', text: 'HERMES skills academy' },
	{ image: '/images/lanuit.jpg.webp', text: 'La Nuit' },
	{ image: '/images/moriokasyoten2023.jpg', text: '森岡書店' },
	{ image: '/images/MIM.jpeg', text: 'MIM' },
	{ image: '/images/roka.jpg', text: '直島旅館ろ霞' },
	{ image: '/images/MARUYOHOTEL.jpg', text: 'MARUYO HOTEL' },
	{ image: '/images/happymouth.jpg', text: 'Happy mouth' },
	{ image: '/images/sari.jpg', text: 'SUI scent by Sari' }
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
