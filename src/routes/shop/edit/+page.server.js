import {
	getDashboardStats,
	getSalesSeries,
	getTopProducts,
	getRecentOrders,
	listOrdersPaged,
	listLowStock,
	listActivity,
	getSettings
} from '$lib/shop/store.js';

// Every date on this screen is a JST calendar date. created_at / at are ISO UTC,
// so all bucketing and formatting happens here (on the server) rather than in the
// component — SSR and hydration must agree on the same strings.
const JST = 'Asia/Tokyo';
const F_YMD = new Intl.DateTimeFormat('sv-SE', { timeZone: JST });
const F_STAMP = new Intl.DateTimeFormat('ja-JP', {
	timeZone: JST,
	month: 'numeric',
	day: 'numeric',
	hour: '2-digit',
	minute: '2-digit'
});
const F_TODAY = new Intl.DateTimeFormat('ja-JP', {
	timeZone: JST,
	year: 'numeric',
	month: 'long',
	day: 'numeric',
	weekday: 'short'
});

/** An order still unshipped after this many days is called out as waiting. */
const SHIP_WARN_DAYS = 3;
/** How many rows each "要対応" / recent list shows before deferring to its page. */
const TODO_ROWS = 5;
const RECENT_ROWS = 8;
const ACTIVITY_ROWS = 8;
const SERIES_DAYS = 30;

function ymd(iso) {
	return iso ? F_YMD.format(new Date(iso)) : '';
}

function stamp(iso) {
	return iso ? F_STAMP.format(new Date(iso)) : '';
}

/** Whole JST days between two 'YYYY-MM-DD' strings (never negative). */
function daysBetween(fromYmd, toYmd) {
	if (!fromYmd || !toYmd) return 0;
	const a = fromYmd.split('-').map(Number);
	const b = toYmd.split('-').map(Number);
	const da = Date.UTC(a[0], a[1] - 1, a[2]);
	const db = Date.UTC(b[0], b[1] - 1, b[2]);
	return Math.max(0, Math.round((db - da) / 86400000));
}

/** 'YYYY-MM-DD' → 'M/D' for chart ticks. */
function shortDate(s) {
	const p = String(s ?? '').split('-');
	return p.length === 3 ? `${Number(p[1])}/${Number(p[2])}` : String(s ?? '');
}

export async function load({ platform }) {
	const db = platform.env.DB;

	const [stats, settings, series, top, recent, unshippedPage, activity] = await Promise.all([
		getDashboardStats(db),
		getSettings(db),
		getSalesSeries(db, SERIES_DAYS),
		getTopProducts(db, { limit: 5, days: SERIES_DAYS }),
		getRecentOrders(db, RECENT_ROWS),
		// oldest first: whatever has waited longest is what needs attention
		listOrdersPaged(db, { status: 'paid', sort: 'old', perPage: 200 }),
		listActivity(db, ACTIVITY_ROWS)
	]);

	const threshold = settings.low_stock_threshold;
	const lowStock = await listLowStock(db, threshold);

	const today = F_YMD.format(new Date());

	// ---- unshipped ---------------------------------------------------------
	const waiting = unshippedPage.orders.map((o) => {
		const days = daysBetween(ymd(o.created_at), today);
		return {
			id: o.id,
			order_no: o.order_no,
			name: o.name,
			total: o.total,
			days,
			late: days >= SHIP_WARN_DAYS
		};
	});
	const lateCount = waiting.filter((o) => o.late).length;

	// ---- 30-day series -----------------------------------------------------
	const chart = series.map((d) => ({ label: shortDate(d.date), value: d.sales }));
	const rangeTotal = series.reduce((s, d) => s + d.sales, 0);
	const rangeCount = series.reduce((s, d) => s + d.count, 0);
	const peakDay = series.reduce((best, d) => (d.sales > (best?.sales ?? -1) ? d : best), null);

	return {
		stats,
		threshold,
		todayLabel: F_TODAY.format(new Date()),
		// null when there is no previous month to compare against
		monthDelta:
			stats.prevMonthSales > 0
				? ((stats.monthSales - stats.prevMonthSales) / stats.prevMonthSales) * 100
				: null,
		chart,
		range: {
			days: SERIES_DAYS,
			total: rangeTotal,
			count: rangeCount,
			perDay: Math.round(rangeTotal / SERIES_DAYS),
			peak: peakDay?.sales ?? 0,
			peakLabel: peakDay && peakDay.sales > 0 ? shortDate(peakDay.date) : ''
		},
		unshipped: waiting.slice(0, TODO_ROWS),
		unshippedTotal: unshippedPage.total,
		lateCount,
		warnDays: SHIP_WARN_DAYS,
		lowStock: lowStock.slice(0, TODO_ROWS).map((p) => ({
			id: p.id,
			name: p.name,
			stock: p.stock
		})),
		lowStockTotal: lowStock.length,
		top: top.map((p) => ({
			product_id: p.product_id,
			name: p.name,
			qty: p.qty,
			sales: p.sales
		})),
		recent: recent.map((o) => ({
			id: o.id,
			order_no: o.order_no,
			name: o.name,
			total: o.total,
			status: o.status,
			qty: (o.items ?? []).reduce((s, i) => s + Number(i.qty ?? 0), 0),
			stamp: stamp(o.created_at)
		})),
		activity: activity.map((a) => ({
			id: a.id,
			stamp: stamp(a.at),
			actor: a.actor,
			action: a.action,
			target: a.target,
			detail: a.detail
		}))
	};
}
