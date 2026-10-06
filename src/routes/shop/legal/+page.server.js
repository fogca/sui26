import { getSettings } from '$lib/shop/store.js';

/**
 * The 特商法 page is rendered from the shop settings, so it can never drift from
 * what the operator entered in /shop/edit/settings. Rows with no value are
 * dropped here rather than in the component — the page only ever receives what
 * it is allowed to publish (never the B2 / notification settings).
 */
export async function load({ platform }) {
	const s = await getSettings(platform.env.DB);

	const address = [s.legal_zip ? `〒${s.legal_zip}` : '', s.legal_address].filter(Boolean).join(' ');
	const tel = s.legal_tel
		? s.legal_tel + (s.legal_tel_hours ? `（受付時間 ${s.legal_tel_hours}）` : '')
		: '';
	const price = ['各商品ページに表示しています。', s.tax_note].filter(Boolean).join(' ');

	const rows = [
		{ label: '販売事業者', value: s.legal_seller || s.store_name },
		{ label: '運営責任者', value: s.legal_manager },
		{ label: '所在地', value: address },
		{ label: '電話番号', value: tel },
		{ label: 'メールアドレス', value: s.legal_email },
		{ label: '販売価格', value: price },
		{ label: '商品代金以外の必要料金', value: s.legal_extra_fees },
		{ label: 'お支払い方法', value: s.legal_payment_methods },
		{ label: 'お支払い時期', value: s.legal_payment_timing },
		{ label: '商品の引き渡し時期', value: s.legal_delivery_timing },
		{ label: '返品・交換について', value: s.legal_return_policy },
		{ label: '返品時の送料負担', value: s.legal_return_shipping },
		{ label: '不良品について', value: s.legal_defect_policy }
	].filter((r) => r.value);

	// "unset" is judged on the legal_* fields only — 販売事業者 falls back to the
	// store name and 販売価格 is derived, so neither of them counts as content.
	const filled = Object.entries(s).some(
		([k, v]) => k.startsWith('legal_') && String(v ?? '').trim() !== ''
	);

	return { rows: filled ? rows : [] };
}
