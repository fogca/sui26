import { fail } from '@sveltejs/kit';
import { listOrders, markShipped, cancelOrder, saveOrderNote } from '$lib/shop/store.js';

export async function load({ platform, url }) {
	// default view = unshipped ('paid'); 'all' shows everything
	const filter = url.searchParams.get('f') ?? 'paid';
	const orders = await listOrders(platform.env.DB, filter !== 'all' ? filter : null);
	return { orders, filter };
}

export const actions = {
	ship: async ({ request, platform }) => {
		const form = await request.formData();
		const id = String(form.get('id') ?? '');
		const tracking = String(form.get('tracking') ?? '').trim();
		if (!id) return fail(400, { error: 'id missing' });
		await markShipped(platform.env.DB, id, tracking);
		// TODO: send shipping-notification mail (Resend) once configured.
		return { ok: true };
	},
	cancel: async ({ request, platform }) => {
		const form = await request.formData();
		const id = String(form.get('id') ?? '');
		const restock = form.get('restock') === 'on';
		if (!id) return fail(400, { error: 'id missing' });
		await cancelOrder(platform.env.DB, id, restock);
		return { ok: true };
	},
	note: async ({ request, platform }) => {
		const form = await request.formData();
		const id = String(form.get('id') ?? '');
		if (!id) return fail(400, { error: 'id missing' });
		await saveOrderNote(platform.env.DB, id, String(form.get('note') ?? ''));
		return { ok: true };
	}
};
