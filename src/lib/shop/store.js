// D1-backed store for the shop: products, orders, customers, settings, logs.
// All prices are tax-inclusive JPY integers.
//
// Time model: created_at / at are ISO-8601 UTC strings ("...Z"). The shop is
// operated from Japan, so every date bucket (today / month / series / range
// filter) is JST. JST is UTC+9 year-round with no DST, so grouping is done in
// SQL with datetime(col,'+9 hours') and in JS with Intl 'Asia/Tokyo'.

function nowIso() {
	return new Date().toISOString();
}

// SQL fragments for JST bucketing. Constant text only — never user input.
const JST_DATE = "date(datetime(created_at, '+9 hours'))";
const JST_MONTH = "substr(datetime(created_at, '+9 hours'), 1, 7)";

const jstFmt = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tokyo' });

/** 'YYYY-MM-DD' in JST, optionally shifted by whole days.
 *  `baseMs` lets a loop anchor every date to one instant so a run that
 *  straddles midnight cannot skip or repeat a day. */
export function jstDay(offsetDays = 0, baseMs = Date.now()) {
	return jstFmt.format(new Date(baseMs + offsetDays * 86400000));
}

/** 'YYYY-MM' in JST. */
export function jstMonth() {
	return jstDay(0).slice(0, 7);
}

function shiftMonth(ym, delta) {
	const [y, m] = ym.split('-').map(Number);
	const idx = y * 12 + (m - 1) + delta;
	return `${Math.floor(idx / 12)}-${String((idx % 12) + 1).padStart(2, '0')}`;
}

function int(v, fallback = 0) {
	const n = typeof v === 'number' ? Math.trunc(v) : parseInt(v, 10);
	return Number.isFinite(n) ? n : fallback;
}

function jsonParse(text, fallback) {
	if (text == null) return fallback;
	if (typeof text === 'object') return text;
	try {
		const v = JSON.parse(text);
		return v ?? fallback;
	} catch {
		return fallback;
	}
}

/** Wildcards in a user query must be literal, so escape them and use ESCAPE. */
function likeTerm(q) {
	return '%' + String(q ?? '').replace(/[\\%_]/g, (c) => '\\' + c) + '%';
}

function paging(page, perPage, total) {
	const pp = Math.max(1, Math.min(200, int(perPage, 20)));
	const pages = Math.max(1, Math.ceil(int(total, 0) / pp));
	const p = Math.min(Math.max(1, int(page, 1)), pages);
	return { page: p, perPage: pp, pages, offset: (p - 1) * pp };
}

/** Order number readable by humans: SUI-YYMMDD-XXXXXX (crypto-random hex). */
function makeOrderNo(prefix = 'SUI') {
	const d = jstDay(0).replaceAll('-', '').slice(2);
	const rand = crypto.randomUUID().replaceAll('-', '').slice(0, 6).toUpperCase();
	return `${prefix}-${d}-${rand}`;
}

function parseProduct(row) {
	if (!row) return null;
	return { ...row, images: jsonParse(row.images, []), tags: jsonParse(row.tags, []) };
}

function parseOrder(row) {
	if (!row) return null;
	return { ...row, items: jsonParse(row.items, []), address: jsonParse(row.address, {}) };
}

// ---- operation log ---------------------------------------------------------

/** Append-only trail of every admin write, so the owner can see what changed.
 *  Never throws: a failed log line must not fail the operation it records. */
export async function logActivity(db, { actor = 'admin', action, target = '', detail = '' } = {}) {
	if (!action) return;
	try {
		await db
			.prepare(
				'INSERT INTO activity_log (id, at, actor, action, target, detail) VALUES (?, ?, ?, ?, ?, ?)'
			)
			.bind('ac_' + crypto.randomUUID(), nowIso(), actor || 'admin', action, target ?? '', detail ?? '')
			.run();
	} catch {
		/* logging is best-effort */
	}
}

export async function listActivity(db, limit = 50) {
	const { results } = await db
		.prepare('SELECT * FROM activity_log ORDER BY at DESC LIMIT ?')
		.bind(Math.max(1, Math.min(500, int(limit, 50))))
		.all();
	return results ?? [];
}

// ---- products --------------------------------------------------------------

// sort_order defaults to 0 everywhere, so this is identical to plain
// created_at DESC until the owner actually reorders something.
const PRODUCT_ORDER = 'ORDER BY sort_order ASC, created_at DESC';

export async function listPublishedProducts(db) {
	const { results } = await db
		.prepare(`SELECT * FROM products WHERE status = 'published' ${PRODUCT_ORDER}`)
		.all();
	return (results ?? []).map(parseProduct);
}

export async function getPublishedProduct(db, slug) {
	const row = await db
		.prepare("SELECT * FROM products WHERE slug = ? AND status = 'published'")
		.bind(slug)
		.first();
	return parseProduct(row);
}

export async function listAllProducts(db) {
	const { results } = await db.prepare(`SELECT * FROM products ${PRODUCT_ORDER}`).all();
	return (results ?? []).map(parseProduct);
}

export async function getProductById(db, id) {
	const row = await db.prepare('SELECT * FROM products WHERE id = ?').bind(id).first();
	return parseProduct(row);
}

export async function productSlugExists(db, slug, excludeId = null) {
	const row = excludeId
		? await db.prepare('SELECT 1 FROM products WHERE slug = ? AND id != ?').bind(slug, excludeId).first()
		: await db.prepare('SELECT 1 FROM products WHERE slug = ?').bind(slug).first();
	return !!row;
}

const PRODUCT_SORT = {
	new: 'ORDER BY created_at DESC',
	old: 'ORDER BY created_at ASC',
	high: 'ORDER BY price DESC, created_at DESC',
	low: 'ORDER BY price ASC, created_at DESC',
	stock: 'ORDER BY stock ASC, created_at DESC',
	name: 'ORDER BY name ASC',
	order: PRODUCT_ORDER
};

export async function listProductsPaged(db, opts = {}) {
	const { q = '', status = null, sort = 'new', page = 1, perPage = 20 } = opts;
	const where = [];
	const args = [];
	if (status) {
		where.push('status = ?');
		args.push(status);
	}
	if (q) {
		where.push("(name LIKE ? ESCAPE '\\' OR slug LIKE ? ESCAPE '\\' OR sku LIKE ? ESCAPE '\\')");
		const t = likeTerm(q);
		args.push(t, t, t);
	}
	const clause = where.length ? 'WHERE ' + where.join(' AND ') : '';

	const countRow = await db
		.prepare(`SELECT COUNT(*) AS cnt FROM products ${clause}`)
		.bind(...args)
		.first();
	const total = int(countRow?.cnt, 0);
	const pg = paging(page, perPage, total);

	const order = PRODUCT_SORT[sort] ?? PRODUCT_SORT.new;
	const { results } = await db
		.prepare(`SELECT * FROM products ${clause} ${order} LIMIT ? OFFSET ?`)
		.bind(...args, pg.perPage, pg.offset)
		.all();
	return {
		products: (results ?? []).map(parseProduct),
		total,
		page: pg.page,
		perPage: pg.perPage,
		pages: pg.pages
	};
}

const PRODUCT_COLUMNS =
	'slug, name, spec, price, images, description, stock, status, sku, barcode, cost, weight_g, category, tags, max_per_order, sort_order, seo_title, seo_description';

/** Positional values matching PRODUCT_COLUMNS. */
function productValues(data) {
	return [
		data.slug,
		data.name,
		data.spec ?? '',
		int(data.price, 0),
		JSON.stringify(data.images ?? []),
		data.description ?? '',
		int(data.stock, 0),
		data.status ?? 'draft',
		data.sku ?? '',
		data.barcode ?? '',
		int(data.cost, 0),
		int(data.weight_g, 0),
		data.category ?? '',
		JSON.stringify(data.tags ?? []),
		Math.max(1, int(data.max_per_order, 9)),
		int(data.sort_order, 0),
		data.seo_title ?? '',
		data.seo_description ?? ''
	];
}

export async function createProduct(db, data) {
	const id = 'pr_' + crypto.randomUUID().slice(0, 8);
	const at = nowIso();
	await db
		.prepare(
			// placeholders are derived from the column list: id + columns + the
			// three timestamps. Hand-counted '?' drifts the moment a column is added.
			`INSERT INTO products (id, ${PRODUCT_COLUMNS}, published_at, created_at, updated_at)
			 VALUES (${new Array(PRODUCT_COLUMNS.split(',').length + 4).fill('?').join(', ')})`
		)
		.bind(id, ...productValues(data), data.status === 'published' ? at : null, at, at)
		.run();
	await logActivity(db, { action: 'product.create', target: id, detail: data.name ?? '' });
	return id;
}

export async function updateProduct(db, id, data) {
	const at = nowIso();
	// published_at is stamped on the first publish and then left alone.
	await db
		.prepare(
			// SET list is generated from PRODUCT_COLUMNS so it stays in lockstep
			// with productValues() when a column is added.
			`UPDATE products SET ${PRODUCT_COLUMNS.split(',')
				.map((c) => `${c.trim()} = ?`)
				.join(', ')},
			 published_at = CASE WHEN ? = 'published' AND published_at IS NULL THEN ? ELSE published_at END,
			 updated_at = ? WHERE id = ?`
		)
		.bind(...productValues(data), data.status ?? 'draft', at, at, id)
		.run();
	await logActivity(db, { action: 'product.update', target: id, detail: data.name ?? '' });
}

export async function deleteProduct(db, id) {
	const before = await getProductById(db, id);
	await db.prepare('DELETE FROM products WHERE id = ?').bind(id).run();
	await logActivity(db, { action: 'product.delete', target: id, detail: before?.name ?? '' });
}

/** Copy a product as a draft. The slug gets a "-copy" suffix, uniquified. */
export async function duplicateProduct(db, id) {
	const src = await getProductById(db, id);
	if (!src) return null;
	let slug = `${src.slug}-copy`;
	for (let n = 2; await productSlugExists(db, slug); n++) slug = `${src.slug}-copy-${n}`;
	const newId = await createProduct(db, { ...src, slug, status: 'draft' });
	await logActivity(db, { action: 'product.duplicate', target: newId, detail: `${src.name} ← ${id}` });
	return newId;
}

export async function bulkSetProductStatus(db, ids, status) {
	const list = (ids ?? []).filter(Boolean);
	if (!list.length) return 0;
	const at = nowIso();
	const res = await db.batch(
		list.map((id) =>
			db
				.prepare(
					`UPDATE products SET status = ?, updated_at = ?,
					 published_at = CASE WHEN ? = 'published' AND published_at IS NULL THEN ? ELSE published_at END
					 WHERE id = ?`
				)
				.bind(status, at, status, at, id)
		)
	);
	const n = res.reduce((sum, r) => sum + int(r?.meta?.changes, 0), 0);
	await logActivity(db, { action: 'product.bulk_status', target: `${n}件`, detail: status });
	return n;
}

export async function listCategories(db) {
	const { results } = await db
		.prepare("SELECT DISTINCT category FROM products WHERE category != '' ORDER BY category")
		.all();
	return (results ?? []).map((r) => r.category);
}

export async function listLowStock(db, threshold = 3) {
	const { results } = await db
		.prepare(
			"SELECT * FROM products WHERE status = 'published' AND stock <= ? ORDER BY stock ASC, name ASC"
		)
		.bind(int(threshold, 3))
		.all();
	return (results ?? []).map(parseProduct);
}

// ---- stock -----------------------------------------------------------------

/** Conditional stock decrement: only applies when enough stock remains.
 *  Returns the prepared statement (for use inside a batch). */
function decrementStockStmt(db, productId, qty) {
	return db
		.prepare('UPDATE products SET stock = stock - ?, updated_at = ? WHERE id = ? AND stock >= ?')
		.bind(qty, nowIso(), productId, qty);
}

export async function incrementStock(db, productId, qty) {
	await db
		.prepare('UPDATE products SET stock = stock + ?, updated_at = ? WHERE id = ?')
		.bind(qty, nowIso(), productId)
		.run();
}

/**
 * Manual stock adjustment with a ledger entry. Stock never goes below 0, and
 * the recorded delta is what was ACTUALLY applied (clamped), not what was asked.
 *
 * The ledger insert and the stock update are one batch, and both are guarded by
 * the same compare-and-set on the stock value we read. The insert runs first so
 * it still sees the pre-update row: either both statements match or neither
 * does, so a move row can never be written without the stock changing.
 */
export async function adjustStock(db, productId, delta, reason = '', actor = 'admin') {
	const want = int(delta, 0);
	for (let attempt = 0; attempt < 3; attempt++) {
		const row = await db.prepare('SELECT stock FROM products WHERE id = ?').bind(productId).first();
		if (!row) return null;
		const cur = int(row.stock, 0);
		const next = Math.max(0, cur + want);
		const applied = next - cur;
		if (applied === 0) return { stock: cur, delta: 0, ok: true };

		const at = nowIso();
		const res = await db.batch([
			db
				.prepare(
					`INSERT INTO stock_moves (id, product_id, delta, reason, actor, created_at)
					 SELECT ?, ?, ?, ?, ?, ? FROM products WHERE id = ? AND stock = ?`
				)
				.bind('sm_' + crypto.randomUUID(), productId, applied, reason ?? '', actor || 'admin', at, productId, cur),
			db
				.prepare('UPDATE products SET stock = ?, updated_at = ? WHERE id = ? AND stock = ?')
				.bind(next, at, productId, cur)
		]);
		if (int(res[1]?.meta?.changes, 0) > 0) {
			await logActivity(db, {
				actor,
				action: 'stock.adjust',
				target: productId,
				detail: `${applied > 0 ? '+' : ''}${applied} → ${next}${reason ? ` / ${reason}` : ''}`
			});
			return { stock: next, delta: applied, ok: true };
		}
		// someone else changed the stock in between — re-read and retry
	}
	return { stock: null, delta: 0, ok: false };
}

export async function listStockMoves(db, opts = {}) {
	const { productId = null, limit = 100 } = opts;
	const lim = Math.max(1, Math.min(500, int(limit, 100)));
	const sql = `SELECT m.*, p.name AS product_name FROM stock_moves m
		LEFT JOIN products p ON p.id = m.product_id
		${productId ? 'WHERE m.product_id = ?' : ''}
		ORDER BY m.created_at DESC LIMIT ?`;
	const { results } = productId
		? await db.prepare(sql).bind(productId, lim).all()
		: await db.prepare(sql).bind(lim).all();
	return results ?? [];
}

// ---- orders ----------------------------------------------------------------

/**
 * Create a paid order after successful payment.
 * - Idempotent per session_id (webhook retries return the existing order).
 * - Order INSERT + stock decrements run in ONE atomic D1 batch, so a partial
 *   failure can never leave stock decremented without an order (or vice versa).
 * - Decrements are conditional (stock >= qty). If a decrement matched nothing
 *   (paid-window race / oversell), the shortfall is surfaced on the order note
 *   and the stock floors at 0 — never silently swallowed.
 * - Retries once on the (astronomically rare) order_no UNIQUE collision.
 */
export async function createPaidOrder(db, data) {
	if (data.session_id) {
		const existing = await db
			.prepare('SELECT * FROM orders WHERE session_id = ?')
			.bind(data.session_id)
			.first();
		if (existing) return { order: parseOrder(existing), created: false };
	}
	const items = data.items ?? [];

	let id, results;
	for (let attempt = 0; ; attempt++) {
		id = 'or_' + crypto.randomUUID();
		const order_no = makeOrderNo(data.order_prefix || 'SUI');
		const insert = db
			.prepare(
				'INSERT INTO orders (id, order_no, provider, session_id, payment_intent, items, subtotal, shipping, total, email, name, phone, address, delivery_note, gift, note, payment_method, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
			)
			.bind(
				id,
				order_no,
				data.provider ?? 'stripe',
				data.session_id ?? null,
				data.payment_intent ?? null,
				JSON.stringify(items),
				data.subtotal ?? 0,
				data.shipping ?? 0,
				data.total ?? 0,
				data.email ?? '',
				data.name ?? '',
				data.phone ?? '',
				JSON.stringify(data.address ?? {}),
				data.delivery_note ?? '',
				data.gift ? 1 : 0,
				data.note ?? '',
				data.payment_method ?? '',
				// 'paid' (未発送) by default; deferred methods (konbini / bank
				// transfer) come in as 'pending_payment' (入金待ち) and are flipped
				// by the async_payment_* webhooks. Stock is reserved either way so
				// a konbini order cannot be oversold while awaiting payment.
				data.status === 'pending_payment' ? 'pending_payment' : 'paid',
				nowIso()
			);
		try {
			results = await db.batch([
				insert,
				...items.map((it) => decrementStockStmt(db, it.product_id, it.qty))
			]);
			break;
		} catch (e) {
			// order_no collision -> regenerate once; session_id collision -> a
			// concurrent call already fulfilled this session, return that order
			if (/UNIQUE/i.test(e?.message ?? '') && data.session_id) {
				const raced = await db
					.prepare('SELECT * FROM orders WHERE session_id = ?')
					.bind(data.session_id)
					.first();
				if (raced) return { order: parseOrder(raced), created: false };
			}
			if (/UNIQUE/i.test(e?.message ?? '') && attempt < 2) continue;
			throw e;
		}
	}

	// surface any oversold lines (conditional decrement matched no row)
	const short = [];
	results.slice(1).forEach((r, i) => {
		if ((r?.meta?.changes ?? 0) === 0) short.push(items[i]);
	});
	if (short.length) {
		for (const it of short) {
			await db
				.prepare('UPDATE products SET stock = 0, updated_at = ? WHERE id = ? AND stock < ?')
				.bind(nowIso(), it.product_id, it.qty)
				.run();
		}
		const warn = '【要確認】在庫超過の可能性: ' + short.map((s) => s.name).join('、');
		await db
			.prepare(
				"UPDATE orders SET note = CASE WHEN note = '' THEN ? ELSE note || char(10) || ? END WHERE id = ?"
			)
			.bind(warn, warn, id)
			.run();
	}

	const row = await db.prepare('SELECT * FROM orders WHERE id = ?').bind(id).first();
	await logActivity(db, {
		actor: 'system',
		action: 'order.paid',
		target: row?.order_no ?? id,
		detail: `¥${int(row?.total, 0).toLocaleString('ja-JP')}`
	});
	return { order: parseOrder(row), created: true };
}

export async function listOrders(db, statusFilter = null) {
	const { results } = statusFilter
		? await db
				.prepare('SELECT * FROM orders WHERE status = ? ORDER BY created_at DESC')
				.bind(statusFilter)
				.all()
		: await db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all();
	return (results ?? []).map(parseOrder);
}

const ORDER_SORT = {
	new: 'ORDER BY created_at DESC',
	old: 'ORDER BY created_at ASC',
	high: 'ORDER BY total DESC, created_at DESC',
	low: 'ORDER BY total ASC, created_at DESC'
};

export async function listOrdersPaged(db, opts = {}) {
	const { status = null, q = '', from = null, to = null, sort = 'new', page = 1, perPage = 20 } = opts;
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
	// from/to are JST calendar dates (inclusive)
	if (from) {
		where.push(`${JST_DATE} >= ?`);
		args.push(from);
	}
	if (to) {
		where.push(`${JST_DATE} <= ?`);
		args.push(to);
	}
	const clause = where.length ? 'WHERE ' + where.join(' AND ') : '';

	const countRow = await db
		.prepare(`SELECT COUNT(*) AS cnt FROM orders ${clause}`)
		.bind(...args)
		.first();
	const total = int(countRow?.cnt, 0);
	const pg = paging(page, perPage, total);

	const order = ORDER_SORT[sort] ?? ORDER_SORT.new;
	const { results } = await db
		.prepare(`SELECT * FROM orders ${clause} ${order} LIMIT ? OFFSET ?`)
		.bind(...args, pg.perPage, pg.offset)
		.all();
	return {
		orders: (results ?? []).map(parseOrder),
		total,
		page: pg.page,
		perPage: pg.perPage,
		pages: pg.pages
	};
}

/** Fetch orders by id, newest first. Chunked to stay under D1's bind limit. */
export async function listOrdersByIds(db, ids) {
	const list = [...new Set((ids ?? []).filter(Boolean))];
	if (!list.length) return [];
	const out = [];
	for (let i = 0; i < list.length; i += 50) {
		const chunk = list.slice(i, i + 50);
		const holes = chunk.map(() => '?').join(',');
		const { results } = await db
			.prepare(`SELECT * FROM orders WHERE id IN (${holes})`)
			.bind(...chunk)
			.all();
		out.push(...(results ?? []));
	}
	return out
		.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
		.map(parseOrder);
}

export async function getOrderBySession(db, sessionId) {
	const row = await db.prepare('SELECT * FROM orders WHERE session_id = ?').bind(sessionId).first();
	return parseOrder(row);
}

export async function getOrderById(db, id) {
	const row = await db.prepare('SELECT * FROM orders WHERE id = ?').bind(id).first();
	return parseOrder(row);
}

/** Mark an order shipped (完了), or update tracking on an already-shipped one.
 *  Guarded so an unpaid order (入金待ち) or a cancelled one can never be
 *  shipped: only 'paid' and 'shipped' rows move. Returns true if it changed. */
export async function markShipped(db, id, trackingNo) {
	const res = await db
		.prepare(
			"UPDATE orders SET status = 'shipped', tracking_no = ?, shipped_at = COALESCE(shipped_at, ?) WHERE id = ? AND status IN ('paid', 'shipped')"
		)
		.bind(trackingNo ?? '', nowIso(), id)
		.run();
	const changed = int(res?.meta?.changes, 0) > 0;
	if (changed) {
		await logActivity(db, { action: 'order.ship', target: id, detail: trackingNo ?? '' });
	}
	return changed;
}

/**
 * Settle a deferred payment (konbini / bank transfer) reported by Stripe's
 * async_payment_succeeded / async_payment_failed webhooks.
 * - success: 入金待ち -> 未発送
 * - failure: 入金待ち -> キャンセル, and the reserved stock goes back
 * Conditional on the row still being 'pending_payment', so repeated webhook
 * deliveries cannot double-apply.
 */
export async function settleAsyncPayment(db, sessionId, ok) {
	if (!sessionId) return null;
	const row = await db
		.prepare("SELECT * FROM orders WHERE session_id = ? AND status = 'pending_payment'")
		.bind(sessionId)
		.first();
	if (!row) return null; // unknown session, or already settled
	const order = parseOrder(row);

	if (ok) {
		const res = await db
			.prepare("UPDATE orders SET status = 'paid' WHERE id = ? AND status = 'pending_payment'")
			.bind(order.id)
			.run();
		if (int(res?.meta?.changes, 0) === 0) return null;
		await logActivity(db, { action: 'order.payment_received', target: order.id, detail: '入金確認' });
		return { order, settled: 'paid' };
	}

	const res = await db
		.prepare("UPDATE orders SET status = 'canceled' WHERE id = ? AND status = 'pending_payment'")
		.bind(order.id)
		.run();
	if (int(res?.meta?.changes, 0) === 0) return null;
	for (const item of order.items) {
		await incrementStock(db, item.product_id, item.qty);
	}
	await logActivity(db, {
		action: 'order.payment_failed',
		target: order.id,
		detail: '入金期限切れ・在庫を戻しました'
	});
	return { order, settled: 'canceled' };
}

/** Ship several orders at once. Only 'paid' rows move, so re-running is safe.
 *  Returns how many actually changed. */
export async function bulkMarkShipped(db, ids) {
	const list = [...new Set((ids ?? []).filter(Boolean))];
	if (!list.length) return 0;
	const at = nowIso();
	let changed = 0;
	for (let i = 0; i < list.length; i += 25) {
		const res = await db.batch(
			list.slice(i, i + 25).map((id) =>
				db
					.prepare("UPDATE orders SET status = 'shipped', shipped_at = ? WHERE id = ? AND status = 'paid'")
					.bind(at, id)
			)
		);
		changed += res.reduce((sum, r) => sum + int(r?.meta?.changes, 0), 0);
	}
	await logActivity(db, { action: 'order.bulk_ship', target: `${changed}件`, detail: list.join(' ') });
	return changed;
}

/** Cancel order; optionally restock its items.
 *  Guarded by a conditional status transition so a double-click / concurrent
 *  cancel can never restock the same items twice. */
export async function cancelOrder(db, id, restock) {
	const order = await getOrderById(db, id);
	if (!order || order.status === 'canceled') return;
	const res = await db
		.prepare("UPDATE orders SET status = 'canceled' WHERE id = ? AND status IN ('paid', 'shipped')")
		.bind(id)
		.run();
	if ((res.meta?.changes ?? 0) === 0) return; // lost the race — someone else canceled
	if (restock) {
		for (const item of order.items) {
			await incrementStock(db, item.product_id, item.qty);
		}
	}
	await logActivity(db, {
		action: 'order.cancel',
		target: order.order_no ?? id,
		detail: restock ? '在庫を戻した' : '在庫はそのまま'
	});
}

/**
 * Record a refund. This does NOT call Stripe — the money is refunded in the
 * Stripe dashboard, and this only keeps the shop's books in sync.
 * Partial refunds accumulate and can never exceed the order total; stock is
 * left alone (use cancelOrder with restock, or adjustStock, for that).
 */
export async function refundOrder(db, id, amount, reason = '') {
	const order = await getOrderById(db, id);
	if (!order) return { ok: false, error: 'not_found' };
	const already = int(order.refunded_amount, 0);
	const remaining = Math.max(0, int(order.total, 0) - already);
	if (remaining === 0) return { ok: false, error: 'already_refunded' };
	let amt = int(amount, 0);
	if (amt <= 0) amt = remaining; // 0 / omitted = refund the rest
	amt = Math.min(amt, remaining);

	const res = await db
		.prepare(
			`UPDATE orders SET refunded_amount = refunded_amount + ?, status = 'refunded'
			 WHERE id = ? AND status IN ('paid', 'shipped', 'refunded')
			   AND refunded_amount + ? <= total`
		)
		.bind(amt, id, amt)
		.run();
	if (int(res.meta?.changes, 0) === 0) return { ok: false, error: 'conflict' };

	if (reason) {
		const line = `返金 ¥${amt.toLocaleString('ja-JP')}: ${reason}`;
		await db
			.prepare(
				"UPDATE orders SET note = CASE WHEN note = '' THEN ? ELSE note || char(10) || ? END WHERE id = ?"
			)
			.bind(line, line, id)
			.run();
	}
	await logActivity(db, {
		action: 'order.refund',
		target: order.order_no ?? id,
		detail: `¥${amt.toLocaleString('ja-JP')}${reason ? ` / ${reason}` : ''}`
	});
	return { ok: true, amount: amt, refunded: already + amt };
}

export async function saveOrderNote(db, id, note) {
	await db.prepare('UPDATE orders SET note = ? WHERE id = ?').bind(note ?? '', id).run();
	await logActivity(db, { action: 'order.note', target: id, detail: '' });
}

/** Fix a delivery address / contact after the order was placed. */
export async function updateOrderShipping(db, id, data = {}) {
	await db
		.prepare(
			'UPDATE orders SET name = ?, phone = ?, email = ?, address = ?, delivery_note = ?, gift = ? WHERE id = ?'
		)
		.bind(
			data.name ?? '',
			data.phone ?? '',
			data.email ?? '',
			JSON.stringify(data.address ?? {}),
			data.delivery_note ?? '',
			data.gift ? 1 : 0,
			id
		)
		.run();
	await logActivity(db, { action: 'order.shipping_edit', target: id, detail: data.name ?? '' });
}

// ---- aggregates ------------------------------------------------------------

// Sales only ever count money that was actually taken and kept.
const SALES_STATUS = "status IN ('paid', 'shipped')";

/** Everything the dashboard needs, in one call. */
export async function getDashboardStats(db) {
	const today = jstDay(0);
	const ym = jstMonth();
	const prevYm = shiftMonth(ym, -1);
	const thRow = await db
		.prepare("SELECT value FROM shop_settings WHERE key = 'low_stock_threshold'")
		.first();
	const threshold = int(thRow?.value, 3);

	const [todayRow, monthRow, prevRow, refundRow, orderStates, productStates, customerRow] =
		await Promise.all([
			db
				.prepare(
					`SELECT COALESCE(SUM(total),0) AS total, COUNT(*) AS cnt FROM orders WHERE ${SALES_STATUS} AND ${JST_DATE} = ?`
				)
				.bind(today)
				.first(),
			db
				.prepare(
					`SELECT COALESCE(SUM(total),0) AS total, COUNT(*) AS cnt FROM orders WHERE ${SALES_STATUS} AND ${JST_MONTH} = ?`
				)
				.bind(ym)
				.first(),
			db
				.prepare(
					`SELECT COALESCE(SUM(total),0) AS total, COUNT(*) AS cnt FROM orders WHERE ${SALES_STATUS} AND ${JST_MONTH} = ?`
				)
				.bind(prevYm)
				.first(),
			db
				.prepare(
					`SELECT COALESCE(SUM(refunded_amount),0) AS total FROM orders WHERE ${JST_MONTH} = ?`
				)
				.bind(ym)
				.first(),
			db.prepare("SELECT COUNT(*) AS cnt FROM orders WHERE status = 'paid'").first(),
			db
				.prepare(
					`SELECT
						SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) AS published,
						SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) AS draft,
						SUM(CASE WHEN status = 'published' AND stock > 0 AND stock <= ? THEN 1 ELSE 0 END) AS low,
						SUM(CASE WHEN status = 'published' AND stock <= 0 THEN 1 ELSE 0 END) AS oos
					 FROM products`
				)
				.bind(threshold)
				.first(),
			db
				.prepare(
					`SELECT COUNT(*) AS total, SUM(CASE WHEN n >= 2 THEN 1 ELSE 0 END) AS repeat_cnt FROM (
						SELECT COUNT(*) AS n FROM orders
						WHERE status != 'canceled' AND email != '' GROUP BY lower(email)
					 )`
				)
				.first()
		]);

	const monthSales = int(monthRow?.total, 0);
	const monthCount = int(monthRow?.cnt, 0);
	return {
		todaySales: int(todayRow?.total, 0),
		todayCount: int(todayRow?.cnt, 0),
		monthSales,
		monthCount,
		prevMonthSales: int(prevRow?.total, 0),
		prevMonthCount: int(prevRow?.cnt, 0),
		// average order value for the current month (0 while the month is empty)
		avgOrderValue: monthCount ? Math.round(monthSales / monthCount) : 0,
		unshippedCount: int(orderStates?.cnt, 0),
		publishedCount: int(productStates?.published, 0),
		draftCount: int(productStates?.draft, 0),
		lowStockCount: int(productStates?.low, 0),
		outOfStockCount: int(productStates?.oos, 0),
		totalCustomers: int(customerRow?.total, 0),
		repeatCustomers: int(customerRow?.repeat_cnt, 0),
		monthRefunded: int(refundRow?.total, 0)
	};
}

/** Daily sales for the last `days` JST days, oldest first, gaps filled with 0. */
export async function getSalesSeries(db, days = 30) {
	const n = Math.max(1, Math.min(365, int(days, 30)));
	const base = Date.now();
	const from = jstDay(-(n - 1), base);
	const { results } = await db
		.prepare(
			`SELECT ${JST_DATE} AS d, COALESCE(SUM(total),0) AS sales, COUNT(*) AS cnt
			 FROM orders WHERE ${SALES_STATUS} AND ${JST_DATE} >= ?
			 GROUP BY d ORDER BY d ASC`
		)
		.bind(from)
		.all();
	const found = new Map((results ?? []).map((r) => [r.d, r]));
	const out = [];
	for (let i = n - 1; i >= 0; i--) {
		const date = jstDay(-i, base);
		const hit = found.get(date);
		out.push({ date, sales: int(hit?.sales, 0), count: int(hit?.cnt, 0) });
	}
	return out;
}

/** Best sellers over the window. Line items live as JSON on the order, so this
 *  is folded in JS — the window is small and it tolerates malformed rows. */
export async function getTopProducts(db, opts = {}) {
	const { limit = 5, days = 30 } = opts;
	const from = jstDay(-(Math.max(1, int(days, 30)) - 1));
	const { results } = await db
		.prepare(`SELECT items FROM orders WHERE ${SALES_STATUS} AND ${JST_DATE} >= ?`)
		.bind(from)
		.all();
	const map = new Map();
	for (const row of results ?? []) {
		for (const it of jsonParse(row.items, [])) {
			const key = it?.product_id || it?.name;
			if (!key) continue;
			const cur = map.get(key) ?? { product_id: it.product_id ?? '', name: it.name ?? '', qty: 0, sales: 0 };
			const qty = int(it.qty, 0);
			cur.qty += qty;
			cur.sales += int(it.price, 0) * qty;
			if (it.name) cur.name = it.name;
			map.set(key, cur);
		}
	}
	return [...map.values()]
		.sort((a, b) => b.sales - a.sales || b.qty - a.qty)
		.slice(0, Math.max(1, int(limit, 5)));
}

export async function getRecentOrders(db, limit = 10) {
	const { results } = await db
		.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT ?')
		.bind(Math.max(1, Math.min(100, int(limit, 10))))
		.all();
	return (results ?? []).map(parseOrder);
}

// ---- customers -------------------------------------------------------------
// There is no customer table: a customer IS the set of orders sharing an email
// (lower-cased, since the address is the identity). Canceled orders are
// excluded from counts and totals, and refunds are subtracted from totals.

const CUSTOMER_BASE = `SELECT lower(email) AS email,
		COUNT(*) AS orders,
		COALESCE(SUM(total - refunded_amount), 0) AS total,
		MAX(created_at) AS last_at,
		MIN(created_at) AS first_at
	FROM orders
	WHERE status != 'canceled' AND email != ''
	GROUP BY lower(email)`;

const CUSTOMER_SORT = {
	recent: 'ORDER BY last_at DESC',
	orders: 'ORDER BY orders DESC, last_at DESC',
	total: 'ORDER BY total DESC, last_at DESC',
	new: 'ORDER BY first_at DESC',
	old: 'ORDER BY first_at ASC'
};

export async function listCustomers(db, opts = {}) {
	const { q = '', sort = 'recent', page = 1, perPage = 20 } = opts;
	// name lives per-order, so match it through the group's concatenated names.
	// lower(email) is spelled out rather than reusing the alias: an unqualified
	// `email` in HAVING resolves to the raw column, which would be case-sensitive.
	const having = q
		? "HAVING (lower(email) LIKE ? ESCAPE '\\' OR lower(group_concat(name)) LIKE ? ESCAPE '\\')"
		: '';
	const args = q ? [likeTerm(String(q).toLowerCase()), likeTerm(String(q).toLowerCase())] : [];
	const grouped = `${CUSTOMER_BASE} ${having}`;

	const countRow = await db
		.prepare(`SELECT COUNT(*) AS cnt FROM (${grouped})`)
		.bind(...args)
		.first();
	const total = int(countRow?.cnt, 0);
	const pg = paging(page, perPage, total);

	const order = CUSTOMER_SORT[sort] ?? CUSTOMER_SORT.recent;
	const { results } = await db
		.prepare(`SELECT * FROM (${grouped}) ${order} LIMIT ? OFFSET ?`)
		.bind(...args, pg.perPage, pg.offset)
		.all();
	const rows = results ?? [];

	// attach the most recent name used by each address on this page
	const names = new Map();
	if (rows.length) {
		const holes = rows.map(() => '?').join(',');
		const { results: nameRows } = await db
			.prepare(
				`SELECT lower(email) AS email, name FROM orders
				 WHERE status != 'canceled' AND lower(email) IN (${holes})
				 ORDER BY created_at DESC`
			)
			.bind(...rows.map((r) => r.email))
			.all();
		for (const r of nameRows ?? []) if (!names.has(r.email) && r.name) names.set(r.email, r.name);
	}

	return {
		customers: rows.map((r) => ({
			email: r.email,
			name: names.get(r.email) ?? '',
			orders: int(r.orders, 0),
			total: int(r.total, 0),
			last_at: r.last_at,
			first_at: r.first_at
		})),
		total,
		page: pg.page,
		perPage: pg.perPage,
		pages: pg.pages
	};
}

export async function getCustomer(db, email) {
	const key = String(email ?? '').toLowerCase();
	if (!key) return null;
	const { results } = await db
		.prepare('SELECT * FROM orders WHERE lower(email) = ? ORDER BY created_at DESC')
		.bind(key)
		.all();
	const orders = (results ?? []).map(parseOrder);
	if (!orders.length) return null;

	const active = orders.filter((o) => o.status !== 'canceled');
	const total = active.reduce((s, o) => s + int(o.total, 0) - int(o.refunded_amount, 0), 0);
	const latest = active[0] ?? orders[0];

	// distinct delivery addresses, most recently used first
	const addresses = [];
	const seen = new Set();
	for (const o of orders) {
		const sig = JSON.stringify(o.address ?? {});
		if (sig === '{}' || seen.has(sig)) continue;
		seen.add(sig);
		addresses.push({ address: o.address, name: o.name, phone: o.phone, last_at: o.created_at });
	}

	const memo = await db.prepare('SELECT * FROM customer_notes WHERE email = ?').bind(key).first();

	return {
		email: key,
		name: latest?.name ?? '',
		phone: latest?.phone ?? '',
		orders,
		stats: {
			count: active.length,
			total,
			avg: active.length ? Math.round(total / active.length) : 0,
			first_at: orders[orders.length - 1]?.created_at ?? null,
			last_at: orders[0]?.created_at ?? null
		},
		addresses,
		note: memo?.note ?? '',
		tags: jsonParse(memo?.tags, [])
	};
}

export async function saveCustomerNote(db, email, note, tags) {
	const key = String(email ?? '').toLowerCase();
	if (!key) return;
	await db
		.prepare(
			`INSERT INTO customer_notes (email, note, tags, updated_at) VALUES (?, ?, ?, ?)
			 ON CONFLICT(email) DO UPDATE SET note = excluded.note, tags = excluded.tags, updated_at = excluded.updated_at`
		)
		.bind(key, note ?? '', JSON.stringify(tags ?? []), nowIso())
		.run();
	await logActivity(db, { action: 'customer.note', target: key, detail: '' });
}

// ---- settings --------------------------------------------------------------

/** Every key getSettings knows about, with its default. Also the whitelist the
 *  settings screen can render from. */
export const SETTINGS_DEFAULTS = {
	// 店舗
	store_name: 'SUI scent studio',
	store_email: '',
	store_phone: '',
	store_url: '',
	// 配送
	shipping_fee: '800',
	free_over: '11000',
	shipping_carrier: 'ヤマト運輸',
	ship_days_note: 'ご注文から3営業日以内に発送',
	cutoff_note: '',
	// B2 (ヤマト送り状発行)
	sender_name: 'SUI scent studio',
	sender_zip: '',
	sender_addr: '',
	sender_tel: '',
	b2_customer_code: '',
	b2_fare_no: '01',
	// 特定商取引法
	legal_seller: '',
	legal_manager: '',
	legal_zip: '',
	legal_address: '',
	legal_tel: '',
	legal_tel_hours: '',
	legal_email: '',
	legal_extra_fees: '送料 全国一律800円（11,000円以上で無料）',
	legal_payment_methods: 'クレジットカード / Apple Pay / PayPay / コンビニ決済',
	legal_payment_timing: 'ご注文時にお支払いが確定します',
	legal_delivery_timing: 'ご注文から3営業日以内に発送',
	legal_return_policy: '',
	legal_return_shipping: '',
	legal_defect_policy: '',
	// 決済
	payment_mode: 'mock',
	currency: 'JPY',
	tax_note: '表示価格はすべて税込です',
	// 通知
	notify_order_to: '',
	notify_bcc: '',
	mail_from: '',
	mail_signature: '',
	notify_on_order: '1',
	notify_on_ship: '1',
	// 運用
	low_stock_threshold: '3',
	order_prefix: 'SUI',
	timezone: 'Asia/Tokyo'
};

// returned as numbers so callers can do arithmetic without parsing
const NUMERIC_SETTINGS = new Set(['shipping_fee', 'free_over', 'low_stock_threshold']);

export async function getSettings(db) {
	const { results } = await db.prepare('SELECT key, value FROM shop_settings').all();
	const saved = {};
	for (const r of results ?? []) saved[r.key] = r.value;

	const out = {};
	for (const [key, fallback] of Object.entries(SETTINGS_DEFAULTS)) {
		const raw = saved[key] ?? fallback;
		out[key] = NUMERIC_SETTINGS.has(key) ? int(raw, int(fallback, 0)) : String(raw ?? '');
	}
	return out;
}

export async function saveSettings(db, entries) {
	const pairs = Object.entries(entries ?? {});
	if (!pairs.length) return;
	// one batch = all keys land together, so a failure never half-saves a form
	await db.batch(
		pairs.map(([key, value]) =>
			db
				.prepare(
					'INSERT INTO shop_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
				)
				.bind(key, String(value ?? ''))
		)
	);
	await logActivity(db, {
		action: 'settings.save',
		target: `${pairs.length}項目`,
		detail: pairs.map(([k]) => k).join(' ')
	});
}
