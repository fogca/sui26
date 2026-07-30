-- Shop: products, orders, and key-value settings.
-- Prices are tax-inclusive JPY integers. Stock decrements on fulfillment
-- (webhook / mock-pay); status stays 'published' at stock 0 (shown sold out).
CREATE TABLE IF NOT EXISTS products (
	id TEXT PRIMARY KEY,
	slug TEXT NOT NULL UNIQUE,
	name TEXT NOT NULL,
	spec TEXT NOT NULL DEFAULT '',
	price INTEGER NOT NULL DEFAULT 0,
	images TEXT NOT NULL DEFAULT '[]',
	description TEXT NOT NULL DEFAULT '',
	stock INTEGER NOT NULL DEFAULT 0,
	status TEXT NOT NULL DEFAULT 'draft',
	created_at TEXT,
	updated_at TEXT
);

CREATE TABLE IF NOT EXISTS orders (
	id TEXT PRIMARY KEY,
	order_no TEXT NOT NULL UNIQUE,
	provider TEXT NOT NULL DEFAULT 'stripe',
	session_id TEXT UNIQUE,
	payment_intent TEXT,
	items TEXT NOT NULL DEFAULT '[]',
	subtotal INTEGER NOT NULL DEFAULT 0,
	shipping INTEGER NOT NULL DEFAULT 0,
	total INTEGER NOT NULL DEFAULT 0,
	email TEXT NOT NULL DEFAULT '',
	name TEXT NOT NULL DEFAULT '',
	phone TEXT NOT NULL DEFAULT '',
	address TEXT NOT NULL DEFAULT '{}',
	delivery_note TEXT NOT NULL DEFAULT '',
	gift INTEGER NOT NULL DEFAULT 0,
	status TEXT NOT NULL DEFAULT 'pending',
	tracking_no TEXT NOT NULL DEFAULT '',
	shipped_at TEXT,
	note TEXT NOT NULL DEFAULT '',
	created_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders (status, created_at);
CREATE INDEX IF NOT EXISTS idx_products_status ON products (status);

CREATE TABLE IF NOT EXISTS shop_settings (
	key TEXT PRIMARY KEY,
	value TEXT NOT NULL DEFAULT ''
);

INSERT OR IGNORE INTO shop_settings (key, value) VALUES
	('shipping_fee', '800'),
	('free_over', '11000'),
	('sender_name', 'SUI scent studio'),
	('sender_zip', ''),
	('sender_addr', ''),
	('sender_tel', '');
