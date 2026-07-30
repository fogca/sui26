import { fail } from '@sveltejs/kit';
import { getSettings, saveSettings } from '$lib/shop/store.js';

export async function load({ platform }) {
	return { settings: await getSettings(platform.env.DB) };
}

export const actions = {
	default: async ({ request, platform }) => {
		const form = await request.formData();
		const shipping_fee = parseInt(String(form.get('shipping_fee') ?? ''), 10);
		const free_over = parseInt(String(form.get('free_over') ?? ''), 10);
		if (!Number.isFinite(shipping_fee) || shipping_fee < 0) return fail(400, { error: '送料が不正です' });
		if (!Number.isFinite(free_over) || free_over < 0) return fail(400, { error: '送料無料ラインが不正です' });
		await saveSettings(platform.env.DB, {
			shipping_fee,
			free_over,
			sender_name: String(form.get('sender_name') ?? ''),
			sender_zip: String(form.get('sender_zip') ?? ''),
			sender_addr: String(form.get('sender_addr') ?? ''),
			sender_tel: String(form.get('sender_tel') ?? ''),
			b2_customer_code: String(form.get('b2_customer_code') ?? ''),
			b2_fare_no: String(form.get('b2_fare_no') ?? '01')
		});
		return { ok: true };
	}
};
