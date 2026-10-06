import { error, fail } from '@sveltejs/kit';
import { getCustomer, saveCustomerNote } from '$lib/shop/store.js';

const MAX_TAGS = 12;
const MAX_TAG_LEN = 24;

/**
 * SvelteKit already percent-decodes route params, so decoding again is only for
 * links that were encoded twice. A value with no '%' left is returned as-is,
 * and a malformed escape falls back to the raw string instead of throwing.
 */
function decodeEmail(raw) {
	const s = String(raw ?? '');
	if (!s.includes('%')) return s;
	try {
		return decodeURIComponent(s);
	} catch {
		return s;
	}
}

/** "常連, 要フォロー" / "常連、要フォロー" -> ['常連', '要フォロー'] */
function parseTags(input) {
	const tags = String(input ?? '')
		.split(/[,、]/)
		.map((t) => t.trim().slice(0, MAX_TAG_LEN))
		.filter(Boolean);
	return [...new Set(tags)].slice(0, MAX_TAGS);
}

export async function load({ platform, params }) {
	const email = decodeEmail(params.email);
	const customer = await getCustomer(platform.env.DB, email);
	if (!customer) error(404, 'この顧客は見つかりませんでした。');
	return { customer };
}

export const actions = {
	note: async ({ request, platform, params }) => {
		const email = decodeEmail(params.email);
		if (!email) return fail(400, { error: 'メールアドレスを特定できませんでした。' });

		const form = await request.formData();
		const note = String(form.get('note') ?? '');
		const tags = parseTags(form.get('tags'));

		await saveCustomerNote(platform.env.DB, email, note, tags);
		return { ok: true };
	}
};
