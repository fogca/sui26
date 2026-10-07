// Lightweight bilingual support. Japanese is the default; English lives under
// an /en prefix which src/hooks.js strips before routing, so there is exactly
// one copy of every route.
//
//   /shop      -> Japanese
//   /en/shop   -> English
//
// Usage in a component:
//   export let data;            // { lang } comes from +layout.server.js
//   $: t = translator(data.lang);
//   <h1>{t('shop.title')}</h1>

export const LANGS = ['ja', 'en'];
export const DEFAULT_LANG = 'ja';

/** Strip a leading /en from a pathname. Returns { lang, path }. */
export function splitLang(pathname) {
	if (pathname === '/en') return { lang: 'en', path: '/' };
	if (pathname.startsWith('/en/')) return { lang: 'en', path: pathname.slice(3) };
	return { lang: 'ja', path: pathname };
}

/** Build a href for the given language: ja keeps the bare path, en gets /en. */
export function localizePath(path, lang) {
	const clean = path.startsWith('/') ? path : `/${path}`;
	if (lang !== 'en') return clean;
	return clean === '/' ? '/en' : `/en${clean}`;
}

const DICT = {
	// ---- global / nav ----------------------------------------------------
	'nav.fragrance': { ja: 'Fragrance', en: 'Fragrance' },
	'nav.works': { ja: 'Works', en: 'Works' },
	'nav.about': { ja: 'About', en: 'About' },
	'nav.contact': { ja: 'Contact', en: 'Contact' },
	// The shop says bag throughout — the control, the drawer and the notices.
	'common.cart': { ja: 'Bag', en: 'Bag' },
	'common.backTo': { ja: '一覧へ戻る', en: 'Back to list' },
	'common.soldOut': { ja: 'SOLD OUT', en: 'SOLD OUT' },
	'common.loading': { ja: '読み込み中…', en: 'Loading…' },
	'common.siteName': { ja: 'SUI scent studio', en: 'SUI scent studio' },
	'common.getInTouch': { ja: 'Get in touch', en: 'Get in touch' },
	// Shown above Japanese-only copy on the English pages. Product notes, log
	// entries and legal text are authored in Japanese; we display the original
	// rather than an unreviewed machine translation.
	'common.jaOnly': {
		ja: '',
		en: 'This text is available in Japanese only.'
	},

	// ---- shop ------------------------------------------------------------
	'shop.title': { ja: 'Fragrance', en: 'Fragrance' },
	'shop.empty': { ja: 'ただいま準備中です。', en: 'Nothing available just now.' },
	// There is no official English for 特定商取引法に基づく表記. "Legal notice" is
	// what Shopify Japan uses for it and is what reads as a label; the Japanese
	// is shown beside it, which is the wording the law is actually about.
	'shop.legal': { ja: '特定商取引法に基づく表記', en: 'Legal notice' },
	'shop.addToCart': { ja: 'バッグに追加', en: 'Add to bag' },
	'shop.soldOutNote': { ja: '売り切れ', en: 'Sold out' },
	'shop.remaining': { ja: '残り{n}点', en: 'Only {n} left' },
	'shop.quantity': { ja: '数量', en: 'Quantity' },
	'shop.checkout': { ja: 'ご購入手続きへ', en: 'Proceed to checkout' },
	'shop.subtotal': { ja: '小計', en: 'Subtotal' },
	'shop.shipping': { ja: '送料', en: 'Shipping' },
	'shop.shippingFree': { ja: '無料', en: 'Free' },
	'shop.total': { ja: '合計', en: 'Total' },
	'shop.cartEmpty': { ja: 'バッグは空です。', en: 'Your bag is empty.' },
	'shop.freeOverNote': {
		ja: 'あと{amount}のお買い上げで送料無料です。',
		en: 'Spend {amount} more for free shipping.'
	},
	'shop.taxNote': { ja: '表示価格はすべて税込です。', en: 'All prices include tax.' },
	'shop.taxIncluded': { ja: '税込', en: 'incl. tax' },
	'shop.backToShop': { ja: '← Shopへ戻る', en: '← Back to Shop' },
	'shop.shippingNote': {
		ja: '送料 {fee} / {free}以上で送料無料',
		en: 'Shipping {fee} — free on orders over {free}'
	},
	'shop.paymentMethods': {
		ja: 'カード・Apple Pay・コンビニ払い・PayPay がご利用いただけます',
		en: 'Card, Apple Pay, convenience store payment and PayPay accepted'
	},
	'shop.payNote': {
		ja: 'カード / Apple Pay / コンビニ払い / PayPay',
		en: 'Card / Apple Pay / Konbini / PayPay'
	},
	'shop.checkoutBusy': { ja: 'お手続きへ…', en: 'Redirecting…' },
	'shop.totalWithTax': { ja: '合計（税込）', en: 'Total (incl. tax)' },
	'shop.freeShipRemain': { ja: 'あと{amount}で送料無料', en: '{amount} more for free shipping' },
	'shop.remove': { ja: '削除', en: 'Remove' },
	'shop.qtyPlus': { ja: '数量を増やす', en: 'Increase quantity' },
	'shop.qtyMinus': { ja: '数量を減らす', en: 'Decrease quantity' },
	'shop.openCart': { ja: 'バッグを開く', en: 'Open bag' },
	'shop.closeCart': { ja: '閉じる', en: 'Close' },
	'shop.error': { ja: 'エラーが発生しました', en: 'Something went wrong.' },

	// ---- legal (特定商取引法) ----------------------------------------------
	'legal.preparing': { ja: '準備中です。', en: 'Coming soon.' },
	'legal.jaNotice': {
		ja: '',
		en: 'The statutory notice below is shown in its legally binding Japanese original.'
	},

	// ---- log -------------------------------------------------------------
	'log.title': { ja: 'log', en: 'log' },
	'log.empty': { ja: 'まだ記事がありません。', en: 'No entries yet.' },
	'log.backToLog': { ja: '← log', en: '← log' },
	'log.jaOnly': { ja: '', en: 'This entry is available in Japanese only.' },
	'log.jaOnlyIndex': { ja: '', en: 'These entries are available in Japanese only.' },

	// ---- about -----------------------------------------------------------
	// ---- contact ---------------------------------------------------------
	// Both leads are the studio's existing mail draft (see works.js), not new
	// writing for the web page.
	'contact.title': { ja: 'Contact', en: 'Contact' },
	'contact.lead': {
		ja: 'SUI scent studioにご興味を持っていただきありがとうございます。\nSUIでは、香りにまつわるプロダクトのディレクションや製作を行っております。\n新たなコラボレーションを楽しみにしております。',
		en: 'Thank you for your interest in SUI scent studio.\nWe direct and create scent-related products and hold scent gatherings.\nWe look forward to new collaborations.'
	},
	'contact.name': { ja: 'お名前', en: 'Name' },
	'contact.email': { ja: 'メールアドレス', en: 'Email' },
	'contact.subject': { ja: 'ご用件', en: 'Subject' },
	'contact.message': { ja: 'メッセージ', en: 'Message' },
	'contact.send': { ja: '送信する', en: 'Send' },
	'contact.note': {
		ja: 'お使いのメールソフトが開き、内容が下書きとして入ります。',
		en: 'Your mail client opens with the message filled in as a draft.'
	},
	'contact.subject.collab': { ja: 'コラボレーションのご相談', en: 'Collaboration' },
	'contact.subject.product': { ja: '商品について', en: 'About a fragrance' },
	'contact.subject.press': { ja: '取材・掲載について', en: 'Press and features' },
	'contact.subject.other': { ja: 'その他', en: 'Something else' },

	// the redrawn frame titles the page in English only
	'about.title': { ja: 'SUI by Sari', en: 'SUI by Sari' },

	// ---- works -----------------------------------------------------------
	'works.title': { ja: 'Works', en: 'Works' },
	'works.lead': {
		ja: '香りをともにつくらせていただいた場所と方々。',
		en: 'Places and people we have made scent with.'
	},

	// ---- thanks ----------------------------------------------------------
	'thanks.title': { ja: 'ご注文ありがとうございます', en: 'Thank you for your order' },
	'thanks.orderNo': { ja: '注文番号', en: 'Order number' },
	'thanks.mailNote': {
		ja: 'ご登録のメールアドレスに確認のご連絡をお送りします。',
		en: 'A confirmation will be sent to your email address.'
	},
	'thanks.mailTo': {
		ja: '確認メールを {email} 宛にお送りします。',
		en: 'A confirmation email will be sent to {email}.'
	},
	'thanks.trackingNote': {
		ja: '発送が完了しましたら、追跡番号をあらためてご案内いたします。',
		en: 'We will send you the tracking number once your order has shipped.'
	},
	'thanks.totalWithTax': { ja: '合計 {amount}（税込）', en: 'Total {amount} (incl. tax)' },
	'thanks.paidTitle': { ja: 'お支払いを確認しました', en: 'Payment confirmed' },
	'thanks.paidNote': {
		ja: '注文情報を処理しています。確認メールをお待ちください。',
		en: 'We are processing your order. A confirmation email will follow shortly.'
	},
	'thanks.notFoundTitle': { ja: 'ご注文情報が見つかりません', en: 'Order not found' },
	'thanks.notFoundNote': {
		ja: 'お手数ですが、メールの注文確認をご覧いただくか、お問い合わせください。',
		en: 'Please check your order confirmation email, or get in touch with us.'
	}
};

/** Return a translate function bound to a language. */
/**
 * Both languages for a key, English first.
 *
 * The site no longer switches language — every page carries English and
 * Japanese together — so this is what most copy goes through. Where an entry
 * reads the same in both, or only one of them makes sense, callers show the one.
 */
export function both(key, vars) {
	const t = (lang) => translator(lang)(key, vars);
	const en = t('en');
	const ja = t('ja');
	return { en, ja, same: en === ja };
}

export function translator(lang) {
	const l = LANGS.includes(lang) ? lang : DEFAULT_LANG;
	return (key, vars) => {
		const entry = DICT[key];
		if (!entry) return key; // surface the missing key rather than blank text
		let out = entry[l] ?? entry[DEFAULT_LANG] ?? key;
		if (vars) {
			for (const [k, v] of Object.entries(vars)) out = out.replaceAll(`{${k}}`, String(v));
		}
		return out;
	};
}
