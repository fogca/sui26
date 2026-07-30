// D1-backed store for the shop: products, orders, settings.
// All prices are tax-inclusive JPY integers.

function nowIso() {
	return new Date().toISOString();
}

/** Order number readable by humans: SUI-YYMMDD-XXXXXX (crypto-random hex). */
function makeOrderNo() {
	const d = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tokyo' })
		.format(new Date())
		.replaceAll('-', '')
		.slice(2);
	const rand = crypto.randomUUID().replaceAll('-', '').slice(0, 6).toUpperCase();
	return `SUI-${d}-${rand}`;
}

function parseProduct(row) {
	if (!row) return null;
	return { ...row, images: JSON.parse(row.images || '[]') };
}

function parseOrder(row) {
	if (!row) return null;
	return { ...row, items: JSON.parse(row.items || '[]'), address: JSON.parse(row.address || '{}') };
}

// ---- products --------------------------------------------------------------

export async function listPublishedProducts(db) {
	const { results } = await db
		.prepare("SELECT * FROM products WHERE status = 'published' ORDER BY created_at DESC")
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
	const { results } = await db.prepare('SELECT * FROM products ORDER BY created_at DESC').all();
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

export async function createProduct(db, data) {
	const id = 'pr_' + crypto.randomUUID().slice(0, 8);
	await db
		.prepare(
			'INSERT INTO products (id, slug, name, spec, price, images, description, stock, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
		)
		.bind(
			id,
			data.slug,
			data.name,
			data.spec ?? '',
			data.price ?? 0,
			JSON.stringify(data.images ?? []),
			data.description ?? '',
			data.stock ?? 0,
			data.status ?? 'draft',
			nowIso(),
			nowIso()
		)
		.run();
	return id;
}

export async function updateProduct(db, id, data) {
	await db
		.prepare(
			'UPDATE products SET slug = ?, name = ?, spec = ?, price = ?, images = ?, description = ?, stock = ?, status = ?, updated_at = ? WHERE id = ?'
		)
		.bind(
			data.slug,
			data.name,
			data.spec ?? '',
			data.price ?? 0,
			JSON.stringify(data.images ?? []),
			data.description ?? '',
			data.stock ?? 0,
			data.status ?? 'draft',
			nowIso(),
			id
		)
		.run();
}

export async function deleteProduct(db, id) {
	await db.prepare('DELETE FROM products WHERE id = ?').bind(id).run();
}

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
		const order_no = makeOrderNo();
		const insert = db
			.prepare(
				"INSERT INTO orders (id, order_no, provider, session_id, payment_intent, items, subtotal, shipping, total, email, name, phone, address, delivery_note, gift, note, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'paid', ?)"
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

export async function getOrderBySession(db, sessionId) {
	const row = await db.prepare('SELECT * FROM orders WHERE session_id = ?').bind(sessionId).first();
	return parseOrder(row);
}

export async function getOrderById(db, id) {
	const row = await db.prepare('SELECT * FROM orders WHERE id = ?').bind(id).first();
	return parseOrder(row);
}

export async function markShipped(db, id, trackingNo) {
	await db
		.prepare("UPDATE orders SET status = 'shipped', tracking_no = ?, shipped_at = ? WHERE id = ?")
		.bind(trackingNo ?? '', nowIso(), id)
		.run();
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
}

export async function saveOrderNote(db, id, note) {
	await db.prepare('UPDATE orders SET note = ? WHERE id = ?').bind(note ?? '', id).run();
}

/** Dashboard stats: this month's sales/count (JST), unshipped count, published count. */
export async function getDashboardStats(db) {
	const ym = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tokyo' })
		.format(new Date())
		.slice(0, 7);
	const sales = await db
		.prepare(
			"SELECT COALESCE(SUM(total),0) AS total, COUNT(*) AS cnt FROM orders WHERE status IN ('paid','shipped') AND substr(created_at,1,7) = ?"
		)
		.bind(ym)
		.first();
	const unshipped = await db
		.prepare("SELECT COUNT(*) AS cnt FROM orders WHERE status = 'paid'")
		.first();
	const products = await db
		.prepare("SELECT COUNT(*) AS cnt FROM products WHERE status = 'published'")
		.first();
	return {
		monthSales: sales?.total ?? 0,
		monthCount: sales?.cnt ?? 0,
		unshippedCount: unshipped?.cnt ?? 0,
		publishedCount: products?.cnt ?? 0
	};
}

// ---- settings --------------------------------------------------------------

export async function getSettings(db) {
	const { results } = await db.prepare('SELECT key, value FROM shop_settings').all();
	const map = {};
	for (const r of results ?? []) map[r.key] = r.value;
	return {
		shipping_fee: parseInt(map.shipping_fee ?? '800', 10),
		free_over: parseInt(map.free_over ?? '11000', 10),
		sender_name: map.sender_name ?? '',
		sender_zip: map.sender_zip ?? '',
		sender_addr: map.sender_addr ?? '',
		sender_tel: map.sender_tel ?? '',
		// Yamato B2 contract values (ご請求先顧客コード / 運賃管理番号)
		b2_customer_code: map.b2_customer_code ?? '',
		b2_fare_no: map.b2_fare_no ?? '01'
	};
}

export async function saveSettings(db, entries) {
	for (const [key, value] of Object.entries(entries)) {
		await db
			.prepare('INSERT INTO shop_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
			.bind(key, String(value))
			.run();
	}
}
