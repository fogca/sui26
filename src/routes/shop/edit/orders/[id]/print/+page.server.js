import { error } from '@sveltejs/kit';
import { getOrderById, getSettings } from '$lib/shop/store.js';

export async function load({ platform, params }) {
	const db = platform.env.DB;
	const order = await getOrderById(db, params.id);
	if (!order) error(404, '注文が見つかりません');

	const settings = await getSettings(db);
	return { order, settings };
}
