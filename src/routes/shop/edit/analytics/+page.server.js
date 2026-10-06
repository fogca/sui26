import { getSalesSeries, getTopProducts, listCustomers } from '$lib/shop/store.js';

// Analytics is read-only: every number here is derived, nothing is written.
// All aggregation happens in this load so the page renders from plain data.

/** Selectable windows, in days. Anything else falls back to 30. */
const RANGES = [7, 30, 90];
const DEFAULT_DAYS = 30;
/** Rows shown in the ranking table (the fold is aggregated into one line). */
const TOP_LIMIT = 20;
/** Fold every product first, so shares are measured against the real total. */
const RANK_SCAN_LIMIT = 500;
const CUSTOMER_PAGE = 200;
/** Hard stop for the customer loop — far beyond this shop's size. */
const CUSTOMER_PAGE_CAP = 10;

// Mirrors store.js: created_at is ISO-8601 UTC and every bucket is JST
// (UTC+9, no DST). Constant text only — never user input.
const JST_DATE = "date(datetime(created_at, '+9 hours'))";

const WEEKDAYS = ['月', '火', '水', '木', '金', '土', '日'];

function sumBy(rows, key) {
	return rows.reduce((n, r) => n + (Number(r[key]) || 0), 0);
}

/** 0 = Monday. The value is already a JST calendar date, so read it as UTC. */
function weekdayIndex(ymd) {
	const [y, m, d] = String(ymd).split('-').map(Number);
	return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
}

/** Average sales per weekday over the window — "which day is worth posting on". */
function weekdayAverages(rows) {
	const total = Array(7).fill(0);
	const dayCount = Array(7).fill(0);
	for (const r of rows) {
		const i = weekdayIndex(r.date);
		total[i] += Number(r.sales) || 0;
		dayCount[i] += 1;
	}
	return WEEKDAYS.map((label, i) => ({
		label,
		avg: dayCount[i] ? Math.round(total[i] / dayCount[i]) : 0,
		total: total[i],
		days: dayCount[i]
	}));
}

/**
 * New (one lifetime order) vs repeat (two or more), folded from listCustomers.
 * This is a lifetime view — customers have no period, only orders do — and the
 * screen says so next to the numbers.
 */
async function customerSplit(db) {
	const acc = {
		fresh: { customers: 0, orders: 0, sales: 0 },
		repeat: { customers: 0, orders: 0, sales: 0 }
	};
	let page = 1;
	let pages = 1;
	do {
		const res = await listCustomers(db, { page, perPage: CUSTOMER_PAGE });
		pages = res.pages;
		for (const c of res.customers) {
			const bucket = c.orders >= 2 ? acc.repeat : acc.fresh;
			bucket.customers += 1;
			bucket.orders += Number(c.orders) || 0;
			bucket.sales += Number(c.total) || 0;
		}
		page += 1;
	} while (page <= pages && page <= CUSTOMER_PAGE_CAP);
	return acc;
}

export async function load({ platform, url }) {
	const db = platform.env.DB;
	const asked = Number(url.searchParams.get('days'));
	const days = RANGES.includes(asked) ? asked : DEFAULT_DAYS;

	// One series covers both windows: the last `days` are the current period,
	// the first `days` are the period immediately before it. Taking both from
	// the same call keeps the two windows aligned to the same midnight.
	const full = await getSalesSeries(db, days * 2);
	const prev = full.slice(0, days);
	const cur = full.slice(days);
	const from = cur[0].date;
	const to = cur[cur.length - 1].date;
	const prevFrom = prev[0].date;
	const prevTo = prev[prev.length - 1].date;

	const [refundRow, ranked, customers] = await Promise.all([
		// Refunds are recorded on the order, so they are summed separately from
		// sales (a refunded order leaves the paid/shipped set entirely).
		db
			.prepare(
				`SELECT
					COALESCE(SUM(CASE WHEN ${JST_DATE} >= ? THEN refunded_amount ELSE 0 END), 0) AS cur,
					COALESCE(SUM(CASE WHEN ${JST_DATE} <  ? THEN refunded_amount ELSE 0 END), 0) AS prev
				 FROM orders
				 WHERE refunded_amount > 0 AND ${JST_DATE} >= ?`
			)
			.bind(from, from, prevFrom)
			.first(),
		getTopProducts(db, { limit: RANK_SCAN_LIMIT, days }),
		customerSplit(db)
	]);

	const sales = sumBy(cur, 'sales');
	const count = sumBy(cur, 'count');
	const prevSales = sumBy(prev, 'sales');
	const prevCount = sumBy(prev, 'count');

	const productTotal = ranked.reduce((n, p) => n + (Number(p.sales) || 0), 0);
	const top = ranked.slice(0, TOP_LIMIT);
	const topSales = top.reduce((n, p) => n + (Number(p.sales) || 0), 0);

	return {
		days,
		range: { from, to, prevFrom, prevTo },
		summary: {
			sales,
			count,
			avg: count ? Math.round(sales / count) : 0,
			refunded: Number(refundRow?.cur) || 0,
			prevSales,
			prevCount,
			prevAvg: prevCount ? Math.round(prevSales / prevCount) : 0,
			prevRefunded: Number(refundRow?.prev) || 0
		},
		series: cur,
		weekdays: weekdayAverages(cur),
		products: {
			rows: top,
			total: productTotal,
			moreCount: Math.max(0, ranked.length - top.length),
			moreSales: Math.max(0, productTotal - topSales)
		},
		customers
	};
}
