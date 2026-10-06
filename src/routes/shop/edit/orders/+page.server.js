import { fail } from '@sveltejs/kit';
import { listOrdersPaged, bulkMarkShipped, jstDay } from '$lib/shop/store.js';
import { ORDER_TABS, DEFAULT_ORDER_MONTHS, BULK_LIMIT } from '$lib/shop/vocab.js';

// Every filter lives in the query string, so a view can be bookmarked, shared
// and restored by the back button. Nothing here is kept in component state.

const STATUSES = ORDER_TABS.map((t) => t.key).filter((k) => k !== 'all');
const SORTS = ['new', 'old', 'high', 'low'];
// One page holds exactly as many rows as one bulk action can move, so
// "select this page" never overflows the bulk limit.
const PER_PAGE = BULK_LIMIT;

// Same JST bucketing as store.js; repeated here because the count query below
// talks to D1 directly (store.js is off limits for this screen).
const JST_DATE = "date(datetime(created_at, '+9 hours'))";

/** Accept only 'YYYY-MM-DD'; anything else becomes "no filter". */
function asDate(v) {
	return /^\d{4}-\d{2}-\d{2}$/.test(v ?? '') ? String(v) : '';
}

/** Wildcards in a user query must be literal, so escape them and use ESCAPE. */
function likeTerm(q) {
	return '%' + String(q ?? '').replace(/[\\%_]/g, (c) => '\\' + c) + '%';
}

/** 'YYYY-MM-DD' in JST, `months` calendar months back from today. */
function monthsAgo(months) {
	const [y, m, d] = jstDay(0).split('-').map(Number);
	const idx = y * 12 + (m - 1) - months;
	const yy = Math.floor(idx / 12);
	const mm = (idx % 12) + 1;
	// clamp the day so e.g. 31 Aug - 6 months lands on 28/29 Feb, not 3 Mar
	const last = new Date(Date.UTC(yy, mm, 0)).getUTCDate();
	const dd = Math.min(d, last);
	return `${yy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
}

/** WHERE fragment + bind args shared by the count and id queries. */
function buildWhere({ status = null, q = '', from = null, to = null }) {
	const where = [];
	const args = [];
	if (status) {
		where.push('status = ?');
		args.push(status);
	}
	if (q) {
		where.push(
			"(order_no LIKE ? ESCAPE '\\' OR name LIKE ? ESCAPE '\\' OR email LIKE ? ESCAPE '\\' OR phone LIKE ? ESCAPE '\\')"
		);
		const t = likeTerm(q);
		args.push(t, t, t, t);
	}
	if (from) {
		where.push(`${JST_DATE} >= ?`);
		args.push(from);
	}
	if (to) {
		where.push(`${JST_DATE} <= ?`);
		args.push(to);
	}
	return { clause: where.length ? 'WHERE ' + where.join(' AND ') : '', args };
}

/**
 * Rows per status for the tab badges, honouring every filter except status.
 * Counting in one grouped query keeps this to a single extra round trip.
 */
async function countByStatus(db, filters) {
	const { clause, args } = buildWhere({ ...filters, status: null });
	const { results } = await db
		.prepare(`SELECT status, COUNT(*) AS cnt FROM orders ${clause} GROUP BY status`)
		.bind(...args)
		.all();

	const counts = { all: 0 };
	for (const key of STATUSES) counts[key] = 0;
	for (const r of results ?? []) {
		const n = Number(r.cnt) || 0;
		counts.all += n;
		if (r.status in counts) counts[r.status] += n;
	}
	return counts;
}

const ORDER_SORT = {
	new: 'ORDER BY created_at DESC',
	old: 'ORDER BY created_at ASC',
	high: 'ORDER BY total DESC, created_at DESC',
	low: 'ORDER BY total ASC, created_at DESC'
};

/**
 * Ids of the whole filtered set — what "絞り込み結果すべてを選択" acts on.
 * Capped at one over the bulk limit so the screen can say "there are more than
 * you can move at once" without loading thousands of rows.
 */
async function matchingIds(db, { sort = 'new', ...filters }) {
	const { clause, args } = buildWhere(filters);
	const order = ORDER_SORT[sort] ?? ORDER_SORT.new;
	const { results } = await db
		.prepare(`SELECT id FROM orders ${clause} ${order} LIMIT ?`)
		.bind(...args, BULK_LIMIT + 1)
		.all();
	return (results ?? []).map((r) => String(r.id));
}

export async function load({ platform, url }) {
	const p = url.searchParams;
	// `f` was the previous param name — honoured so old bookmarks still land.
	const rawStatus = p.get('status') ?? p.get('f') ?? 'paid';
	const status = STATUSES.includes(rawStatus) ? rawStatus : 'all';
	const rawSort = p.get('sort') ?? '';
	const sort = SORTS.includes(rawSort) ? rawSort : 'new';
	const q = (p.get('q') ?? '').trim();
	let from = asDate(p.get('from'));
	const to = asDate(p.get('to'));

	// STORES opens this screen pre-filtered to the last six months. We do the
	// same, but only when the owner has not asked for a range themselves and
	// has not pressed [リセット] (?all=1).
	const showAll = p.get('all') === '1';
	const autoRange = !from && !to && !showAll;
	if (autoRange) from = monthsAgo(DEFAULT_ORDER_MONTHS);

	const [result, counts, matchIds] = await Promise.all([
		listOrdersPaged(platform.env.DB, {
			status: status === 'all' ? null : status,
			q,
			from: from || null,
			to: to || null,
			sort,
			page: Number(p.get('page')) || 1,
			perPage: PER_PAGE
		}),
		countByStatus(platform.env.DB, { q, from: from || null, to: to || null }),
		matchingIds(platform.env.DB, {
			status: status === 'all' ? null : status,
			q,
			from: from || null,
			to: to || null,
			sort
		})
	]);

	return {
		...result,
		counts,
		query: {
			status,
			q,
			// `from` is echoed back so the date input shows the range in force;
			// `autoRange` tells the screen it was applied for the owner.
			from: autoRange ? '' : from,
			to,
			sort,
			all: showAll ? '1' : ''
		},
		autoRange,
		autoFrom: autoRange ? from : '',
		bulkLimit: BULK_LIMIT,
		// capped at BULK_LIMIT here; `total` is what the screen quotes to the owner
		matchIds: matchIds.slice(0, BULK_LIMIT)
	};
}

export const actions = {
	// Mark several orders shipped at once. bulkMarkShipped only moves rows that
	// are still 'paid', so `shipped` can legitimately be lower than `requested`
	// (someone else shipped one meanwhile) — both are returned so the screen can
	// say exactly what happened instead of just "done".
	bulkShip: async ({ request, platform }) => {
		const form = await request.formData();
		const ids = form.getAll('ids').map(String).filter(Boolean);
		if (!ids.length) return fail(400, { error: 'オーダーが選択されていません。' });
		if (ids.length > BULK_LIMIT) {
			return fail(400, { error: `一度に処理できるのは${BULK_LIMIT}件までです。` });
		}
		const shipped = await bulkMarkShipped(platform.env.DB, ids);
		// TODO: send shipping-notification mail (Resend) once configured.
		return { shipped, requested: ids.length };
	}
};
