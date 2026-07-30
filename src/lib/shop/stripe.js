// Payment provider abstraction (same pattern as Miles158):
// - With STRIPE_SECRET_KEY set  -> real Stripe hosted Checkout via REST API.
// - Without it (local dev)      -> mock checkout flow that exercises the
//   exact same fulfillment path, so the whole shop works end-to-end today.
//
// No Stripe SDK dependency: Workers-safe fetch + form encoding.

const STRIPE_API = 'https://api.stripe.com/v1';

export function stripeKey(platform) {
	return platform?.env?.STRIPE_SECRET_KEY || '';
}

/**
 * Mock mode must be EXPLICITLY enabled (SHOP_MOCK=1 in .dev.vars). A missing
 * Stripe key in production therefore fails closed (checkout 503) instead of
 * silently accepting unpaid "orders".
 */
export function isMockMode(platform) {
	return !stripeKey(platform) && platform?.env?.SHOP_MOCK === '1';
}

/** Flatten a nested object into Stripe's form-encoded bracket notation. */
export function toForm(obj, prefix = '', out = new URLSearchParams()) {
	for (const [k, v] of Object.entries(obj)) {
		const key = prefix ? `${prefix}[${k}]` : k;
		if (v === null || v === undefined) continue;
		if (typeof v === 'object' && !Array.isArray(v)) {
			toForm(v, key, out);
		} else if (Array.isArray(v)) {
			v.forEach((item, i) => {
				if (typeof item === 'object') toForm(item, `${key}[${i}]`, out);
				else out.append(`${key}[${i}]`, String(item));
			});
		} else {
			out.append(key, String(v));
		}
	}
	return out;
}

async function stripeRequest(key, path, params, method = 'POST') {
	const res = await fetch(`${STRIPE_API}${path}`, {
		method,
		headers: {
			Authorization: `Bearer ${key}`,
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		body: method === 'GET' ? undefined : toForm(params)
	});
	const json = await res.json();
	if (!res.ok) {
		throw new Error(json?.error?.message ?? `stripe ${path} failed (${res.status})`);
	}
	return json;
}

/** Delivery time-slot choices shown in Checkout (Yamato slots). */
export const TIME_SLOTS = [
	{ label: '指定なし', value: 'none' },
	{ label: '午前中', value: 'am' },
	{ label: '14時-16時', value: 's1416' },
	{ label: '16時-18時', value: 's1618' },
	{ label: '18時-20時', value: 's1820' },
	{ label: '19時-21時', value: 's1921' }
];

/**
 * Create a checkout for validated line items.
 * items: [{ product_id, name, price, qty }] (server-validated against D1)
 * Returns { url } to redirect the buyer to.
 */
export async function createCheckout(platform, { items, shipping, origin }) {
	const key = stripeKey(platform);
	const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);

	if (!key) {
		if (!isMockMode(platform)) {
			throw new Error('payments not configured');
		}
		// Mock mode: hand off to the local mock checkout page. Cart contents are
		// carried in an opaque token (base64 JSON) — validated again at mock-pay.
		const token = btoa(encodeURIComponent(JSON.stringify({ items, shipping, subtotal })));
		return { url: `/shop/mock-checkout?cart=${token}`, mock: true };
	}

	const params = {
		mode: 'payment',
		locale: 'ja',
		success_url: `${origin}/shop/thanks?session_id={CHECKOUT_SESSION_ID}`,
		cancel_url: `${origin}/shop?canceled=1`,
		allow_promotion_codes: 'true',
		phone_number_collection: { enabled: 'true' },
		shipping_address_collection: { allowed_countries: ['JP'] },
		shipping_options: [
			{
				shipping_rate_data: {
					display_name: shipping === 0 ? '送料無料' : '宅急便',
					type: 'fixed_amount',
					fixed_amount: { amount: shipping, currency: 'jpy' }
				}
			}
		],
		line_items: items.map((i) => ({
			quantity: i.qty,
			price_data: {
				currency: 'jpy',
				unit_amount: i.price,
				product_data: { name: i.name }
			}
		})),
		// NOTE: Checkout allows at most 3 custom_fields (dropdown/numeric/text only)
		custom_fields: [
			{
				key: 'timeslot',
				label: { type: 'custom', custom: '配送時間帯のご希望' },
				type: 'dropdown',
				optional: 'true',
				dropdown: { options: TIME_SLOTS.map((t) => ({ label: t.label, value: t.value })) }
			},
			{
				key: 'gift',
				label: { type: 'custom', custom: 'ギフト包装' },
				type: 'dropdown',
				optional: 'true',
				dropdown: {
					options: [
						{ label: '不要', value: 'no' },
						{ label: '希望する', value: 'yes' }
					]
				}
			},
			{
				key: 'note',
				label: { type: 'custom', custom: '備考（任意）' },
				type: 'text',
				optional: 'true'
			}
		],
		// fulfillment snapshot: id:qty:unit_price — the webhook must bill from
		// these values, not the (possibly edited) DB state at delivery time
		metadata: { cart: items.map((i) => `${i.product_id}:${i.qty}:${i.price}`).join(',') }
	};

	const session = await stripeRequest(key, '/checkout/sessions', params);
	return { url: session.url, mock: false };
}

/** Retrieve a Checkout Session (for the thanks page in real mode). */
export async function retrieveSession(platform, sessionId) {
	const key = stripeKey(platform);
	if (!key) return null;
	const res = await fetch(`${STRIPE_API}/checkout/sessions/${sessionId}`, {
		headers: { Authorization: `Bearer ${key}` }
	});
	if (!res.ok) return null;
	return res.json();
}

/**
 * Verify a Stripe webhook signature with WebCrypto.
 * - accepts ANY matching v1 signature (Stripe sends several while an endpoint
 *   secret is being rotated)
 * - rejects non-numeric timestamps (NaN must not disable the replay window)
 * - constant-time comparison
 * Returns the parsed event or null if invalid.
 */
export async function verifyWebhook(payload, sigHeader, secret) {
	if (!sigHeader || !secret) return null;

	let t = null;
	const v1s = [];
	for (const part of sigHeader.split(',')) {
		const idx = part.indexOf('=');
		if (idx === -1) continue;
		const k = part.slice(0, idx).trim();
		const v = part.slice(idx + 1).trim();
		if (k === 't') t = v;
		else if (k === 'v1' && v) v1s.push(v);
	}
	const ts = Number(t);
	if (!Number.isFinite(ts)) return null;
	if (Math.abs(Date.now() / 1000 - ts) > 300) return null; // replay window
	if (!v1s.length) return null;

	const enc = new TextEncoder();
	const cryptoKey = await crypto.subtle.importKey(
		'raw',
		enc.encode(secret),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign']
	);
	const sig = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(`${t}.${payload}`));
	const expected = [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');

	if (!v1s.some((v) => constantTimeEqual(expected, v))) return null;

	try {
		return JSON.parse(payload);
	} catch {
		return null;
	}
}

/** Timing-safe string comparison (XOR accumulate, no early exit). */
function constantTimeEqual(a, b) {
	const len = Math.max(a.length, b.length);
	let diff = a.length === b.length ? 0 : 1;
	for (let i = 0; i < len; i++) {
		diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
	}
	return diff === 0;
}
