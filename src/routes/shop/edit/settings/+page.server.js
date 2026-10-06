import { fail } from '@sveltejs/kit';
import { getSettings, saveSettings } from '$lib/shop/store.js';

/**
 * Tabs own their keys. A save writes only the keys of the posted tab, so a form
 * can never blank out a field that was not on screen.
 */
const TABS = [
	{
		key: 'store',
		label: '店舗情報',
		keys: ['store_name', 'store_email', 'store_phone', 'store_url']
	},
	{
		key: 'shipping',
		label: '配送',
		keys: ['shipping_fee', 'free_over', 'shipping_carrier', 'ship_days_note', 'cutoff_note']
	},
	{
		key: 'payment',
		label: '決済',
		keys: ['payment_mode', 'currency', 'tax_note']
	},
	{
		key: 'legal',
		label: '特定商取引法',
		keys: [
			'legal_seller',
			'legal_manager',
			'legal_zip',
			'legal_address',
			'legal_tel',
			'legal_tel_hours',
			'legal_email',
			'legal_extra_fees',
			'legal_payment_methods',
			'legal_payment_timing',
			'legal_delivery_timing',
			'legal_return_policy',
			'legal_return_shipping',
			'legal_defect_policy'
		]
	},
	{
		key: 'notify',
		label: '通知',
		keys: [
			'notify_order_to',
			'notify_bcc',
			'mail_from',
			'mail_signature',
			'notify_on_order',
			'notify_on_ship'
		]
	},
	{
		key: 'b2',
		label: '配送業者(B2)',
		keys: [
			'sender_name',
			'sender_zip',
			'sender_addr',
			'sender_tel',
			'b2_customer_code',
			'b2_fare_no'
		]
	},
	{
		key: 'ops',
		label: '運用',
		keys: ['low_stock_threshold', 'order_prefix', 'timezone']
	}
];

// checkboxes: absent in the payload means "off", not "unchanged"
const BOOLEAN_KEYS = new Set(['notify_on_order', 'notify_on_ship']);

const NUMERIC_LABELS = {
	shipping_fee: '送料',
	free_over: '送料無料ライン',
	low_stock_threshold: '在庫僅少のしきい値'
};

const EMAIL_LABELS = {
	store_email: '店舗メールアドレス',
	legal_email: 'メールアドレス',
	notify_order_to: '通知先メールアドレス',
	mail_from: '送信元メールアドレス'
};

const EMAIL_RE = /^[^\s@,]+@[^\s@,]+\.[^\s@,]+$/;

/** HH:MM in JST — shown next to 保存しました so a save is visibly time-stamped. */
function jstTime() {
	return new Intl.DateTimeFormat('sv-SE', {
		timeZone: 'Asia/Tokyo',
		hour: '2-digit',
		minute: '2-digit'
	}).format(new Date());
}

export async function load({ url, platform }) {
	const settings = await getSettings(platform.env.DB);
	const requested = url.searchParams.get('tab');
	const tab = TABS.some((t) => t.key === requested) ? requested : 'store';
	return {
		settings,
		tab,
		tabs: TABS.map(({ key, label }) => ({ key, label }))
	};
}

export const actions = {
	default: async ({ request, platform }) => {
		const form = await request.formData();
		const tab = String(form.get('tab') ?? '');
		const def = TABS.find((t) => t.key === tab);
		if (!def) return fail(400, { tab, error: '不明なタブです。ページを再読み込みしてください。' });

		const entries = {};
		for (const key of def.keys) {
			entries[key] = BOOLEAN_KEYS.has(key)
				? form.has(key)
					? '1'
					: '0'
				: String(form.get(key) ?? '').trim();
		}

		// --- numbers: required, integer, never negative
		for (const [key, label] of Object.entries(NUMERIC_LABELS)) {
			if (!(key in entries)) continue;
			const raw = entries[key];
			const n = Number(raw);
			if (raw === '' || !Number.isInteger(n) || n < 0) {
				return fail(400, { tab, field: key, error: `${label}は0以上の整数で入力してください。` });
			}
			entries[key] = String(n);
		}

		// --- addresses: a typo here means notifications silently go nowhere
		for (const [key, label] of Object.entries(EMAIL_LABELS)) {
			const v = entries[key];
			if (!v) continue;
			if (!EMAIL_RE.test(v)) {
				return fail(400, { tab, field: key, error: `${label}の形式が正しくありません。` });
			}
		}
		if (entries.notify_bcc) {
			const bad = entries.notify_bcc
				.split(',')
				.map((s) => s.trim())
				.filter(Boolean)
				.find((s) => !EMAIL_RE.test(s));
			if (bad) {
				return fail(400, {
					tab,
					field: 'notify_bcc',
					error: `BCCの「${bad}」がメールアドレスの形式ではありません。`
				});
			}
		}

		if (entries.store_url && !/^https?:\/\//.test(entries.store_url)) {
			return fail(400, {
				tab,
				field: 'store_url',
				error: 'サイトURLは https:// から入力してください。'
			});
		}

		if ('payment_mode' in entries && !['mock', 'live'].includes(entries.payment_mode)) {
			return fail(400, { tab, field: 'payment_mode', error: '決済モードの値が不正です。' });
		}

		if ('order_prefix' in entries && !/^[A-Za-z0-9-]{1,8}$/.test(entries.order_prefix)) {
			return fail(400, {
				tab,
				field: 'order_prefix',
				error: '注文番号の接頭辞は半角英数字・ハイフン 1〜8文字で入力してください。'
			});
		}

		await saveSettings(platform.env.DB, entries);
		return { ok: true, tab, count: Object.keys(entries).length, at: jstTime() };
	}
};
