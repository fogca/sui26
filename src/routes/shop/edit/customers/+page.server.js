import { listCustomers } from '$lib/shop/store.js';

// Whitelist: anything else falls back to 'recent' so a hand-edited URL can
// never reach the ORDER BY lookup with an unknown key.
const SORTS = new Set(['recent', 'orders', 'total']);
const PER_PAGE = 20;

/**
 * Shop-wide customer figures for the summary row.
 *
 * There is no customer table — a customer IS one lower-cased email — so this
 * repeats store.js's grouping exactly: canceled orders are excluded and
 * refunds are subtracted from what the customer actually spent.
 */
async function loadSummary(db) {
	const row = await db
		.prepare(
			`SELECT COUNT(*) AS people,
			        COALESCE(SUM(CASE WHEN n >= 2 THEN 1 ELSE 0 END), 0) AS repeaters,
			        COALESCE(SUM(spent), 0) AS spent
			 FROM (
				SELECT COUNT(*) AS n, SUM(total - refunded_amount) AS spent
				FROM orders
				WHERE status != 'canceled' AND email != ''
				GROUP BY lower(email)
			 )`
		)
		.first();

	const people = Number(row?.people ?? 0);
	const repeaters = Number(row?.repeaters ?? 0);
	const spent = Number(row?.spent ?? 0);
	return {
		people,
		repeaters,
		// one decimal place, and 0% rather than NaN while the shop is empty
		repeatRate: people ? Math.round((repeaters / people) * 1000) / 10 : 0,
		avgLtv: people ? Math.round(spent / people) : 0
	};
}

export async function load({ platform, url }) {
	const db = platform.env.DB;
	const q = (url.searchParams.get('q') ?? '').trim();
	const raw = url.searchParams.get('sort') ?? 'recent';
	const sort = SORTS.has(raw) ? raw : 'recent';
	const page = Math.max(1, Number(url.searchParams.get('page')) || 1);

	const [list, summary] = await Promise.all([
		listCustomers(db, { q, sort, page, perPage: PER_PAGE }),
		loadSummary(db)
	]);

	return { list, summary, q, sort };
}
