import { json } from '@sveltejs/kit';
import { verifyWebhook } from '$lib/shop/stripe.js';
import { getProductById, createPaidOrder, settleAsyncPayment } from '$lib/shop/store.js';

// Public: Stripe webhook.
//   checkout.session.completed          -> create the order, reserve stock
//   checkout.session.async_payment_*    -> settle konbini / bank transfer
// Idempotent via orders.session_id UNIQUE and conditional status transitions.
// Configure the endpoint secret with: wrangler secret put STRIPE_WEBHOOK_SECRET
export async function POST({ request, platform }) {
	const secret = platform?.env?.STRIPE_WEBHOOK_SECRET || '';
	const payload = await request.text();
	const event = await verifyWebhook(payload, request.headers.get('stripe-signature'), secret);
	if (!event) {
		return new Response('invalid signature', { status: 400 });
	}

	// Deferred payment methods settle later: konbini and bank transfer fire
	// checkout.session.completed with payment_status 'unpaid', then one of these.
	if (
		event.type === 'checkout.session.async_payment_succeeded' ||
		event.type === 'checkout.session.async_payment_failed'
	) {
		await settleAsyncPayment(
			platform.env.DB,
			event.data.object?.id,
			event.type === 'checkout.session.async_payment_succeeded'
		);
		// TODO: notify the customer once Resend is wired up.
		return json({ received: true });
	}

	if (event.type === 'checkout.session.completed') {
		const session = event.data.object;
		// 'paid'   -> card / wallet: money is captured, order is ready to ship
		// 'unpaid' -> konbini / bank transfer: record it as 入金待ち so the owner
		//             never ships before the money lands. Anything else (e.g.
		//             'no_payment_required') is ignored.
		const deferred = session.payment_status === 'unpaid';
		if (session.payment_status === 'paid' || deferred) {
			const db = platform.env.DB;

			// Rebuild items from the checkout-time snapshot ("id:qty:price").
			// Prices come from the snapshot (what was actually billed), never
			// from the current DB state; deleted products keep their line.
			const items = [];
			for (const pair of String(session.metadata?.cart ?? '').split(',')) {
				const [id, qtyStr, priceStr] = pair.split(':');
				const qty = parseInt(qtyStr, 10);
				const price = parseInt(priceStr, 10);
				if (!id || !Number.isFinite(qty) || qty < 1) continue;
				const p = await getProductById(db, id);
				const name = p ? (p.spec ? `${p.name}（${p.spec}）` : p.name) : '（削除された商品）';
				items.push({
					product_id: id,
					name,
					price: Number.isFinite(price) ? price : (p?.price ?? 0),
					qty
				});
			}

			const fields = Object.fromEntries(
				(session.custom_fields ?? []).map((f) => [
					f.key,
					f.dropdown?.value ?? f.text?.value ?? f.numeric?.value ?? ''
				])
			);
			const addr = session.customer_details?.address ?? {};

			await createPaidOrder(db, {
				provider: 'stripe',
				session_id: session.id,
				payment_intent: session.payment_intent,
				items,
				subtotal: session.amount_subtotal ?? 0,
				shipping: session.total_details?.amount_shipping ?? 0,
				total: session.amount_total ?? 0,
				email: session.customer_details?.email ?? '',
				name: session.customer_details?.name ?? '',
				phone: session.customer_details?.phone ?? '',
				address: {
					zip: addr.postal_code ?? '',
					state: addr.state ?? '',
					city: addr.city ?? '',
					line1: addr.line1 ?? '',
					line2: addr.line2 ?? ''
				},
				delivery_note: fields.timeslot && fields.timeslot !== 'none' ? fields.timeslot : '',
				gift: fields.gift === 'yes',
				note: fields.note ? `【お客様備考】${fields.note}` : '',
				payment_method: (session.payment_method_types ?? [])[0] ?? '',
				// konbini / bank transfer land as 入金待ち until Stripe confirms
				status: deferred ? 'pending_payment' : 'paid'
			});
			// TODO: send order-confirmation mail via Resend once RESEND_API_KEY is set.
		}
	}

	return json({ received: true });
}
