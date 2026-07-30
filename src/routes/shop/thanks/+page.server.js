import { getOrderBySession } from '$lib/shop/store.js';
import { isMockMode, retrieveSession } from '$lib/shop/stripe.js';

// Order confirmation. In mock mode the order exists immediately; with real
// Stripe the webhook may lag a moment behind the redirect, so fall back to
// the session status from the Stripe API.
export async function load({ url, platform }) {
	const sessionId = url.searchParams.get('session_id');
	if (!sessionId) return { order: null, pending: false };

	const order = await getOrderBySession(platform.env.DB, sessionId);
	if (order) {
		return {
			order: {
				order_no: order.order_no,
				total: order.total,
				email: order.email,
				items: order.items
			},
			pending: false
		};
	}

	if (!isMockMode(platform)) {
		const session = await retrieveSession(platform, sessionId);
		if (session?.payment_status === 'paid') {
			// paid but webhook not yet processed
			return { order: null, pending: true };
		}
	}
	return { order: null, pending: false };
}
