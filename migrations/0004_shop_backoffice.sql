-- Shop back office: richer product/order fields, stock ledger, customer notes,
-- operation log, and the full settings key set.
-- Money stays tax-inclusive JPY integers. Timestamps stay ISO-8601 UTC
-- ("...Z"); JST grouping is done at query time with datetime(x,'+9 hours').

-- ---- products --------------------------------------------------------------
ALTER TABLE products ADD COLUMN sku TEXT NOT NULL DEFAULT '';
ALTER TABLE products ADD COLUMN cost INTEGER NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN weight_g INTEGER NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN category TEXT NOT NULL DEFAULT '';
ALTER TABLE products ADD COLUMN tags TEXT NOT NULL DEFAULT '[]';
ALTER TABLE products ADD COLUMN max_per_order INTEGER NOT NULL DEFAULT 9;
ALTER TABLE products ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN seo_title TEXT NOT NULL DEFAULT '';
ALTER TABLE products ADD COLUMN seo_description TEXT NOT NULL DEFAULT '';
ALTER TABLE products ADD COLUMN published_at TEXT;

-- Backfill: already-public products count as published since they were created.
UPDATE products SET published_at = created_at
	WHERE status = 'published' AND published_at IS NULL;

-- ---- orders ----------------------------------------------------------------
ALTER TABLE orders ADD COLUMN payment_method TEXT NOT NULL DEFAULT '';
ALTER TABLE orders ADD COLUMN refunded_amount INTEGER NOT NULL DEFAULT 0;

-- ---- stock ledger ----------------------------------------------------------
-- Every manual stock change is recorded here (delta is the amount actually
-- applied after clamping at 0, never the requested amount).
CREATE TABLE IF NOT EXISTS stock_moves (
	id TEXT PRIMARY KEY,
	product_id TEXT NOT NULL,
	delta INTEGER NOT NULL DEFAULT 0,
	reason TEXT NOT NULL DEFAULT '',
	actor TEXT NOT NULL DEFAULT '',
	created_at TEXT
);

-- ---- customer notes --------------------------------------------------------
-- Customers themselves are derived from orders (no customer table); this only
-- holds the shop owner's private memo + tags, keyed by lower-cased email.
CREATE TABLE IF NOT EXISTS customer_notes (
	email TEXT PRIMARY KEY,
	note TEXT NOT NULL DEFAULT '',
	tags TEXT NOT NULL DEFAULT '[]',
	updated_at TEXT
);

-- ---- operation log ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS activity_log (
	id TEXT PRIMARY KEY,
	at TEXT,
	actor TEXT NOT NULL DEFAULT '',
	action TEXT NOT NULL DEFAULT '',
	target TEXT NOT NULL DEFAULT '',
	detail TEXT NOT NULL DEFAULT ''
);

-- ---- indexes ---------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders (created_at);
CREATE INDEX IF NOT EXISTS idx_orders_email ON orders (email);
CREATE INDEX IF NOT EXISTS idx_orders_total ON orders (total);
CREATE INDEX IF NOT EXISTS idx_products_sort ON products (sort_order, created_at);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products (sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON products (category);
CREATE INDEX IF NOT EXISTS idx_stock_moves_product ON stock_moves (product_id, created_at);
CREATE INDEX IF NOT EXISTS idx_activity_at ON activity_log (at);

-- ---- settings defaults -----------------------------------------------------
-- INSERT OR IGNORE so values already saved by the owner are never overwritten.
INSERT OR IGNORE INTO shop_settings (key, value) VALUES
	-- 店舗
	('store_name', 'SUI scent studio'),
	('store_email', ''),
	('store_phone', ''),
	('store_url', ''),
	-- 配送
	('shipping_fee', '800'),
	('free_over', '11000'),
	('shipping_carrier', 'ヤマト運輸'),
	('ship_days_note', 'ご注文から3営業日以内に発送'),
	('cutoff_note', ''),
	-- B2 (ヤマト送り状発行)
	('sender_name', 'SUI scent studio'),
	('sender_zip', ''),
	('sender_addr', ''),
	('sender_tel', ''),
	('b2_customer_code', ''),
	('b2_fare_no', '01'),
	-- 特定商取引法
	('legal_seller', ''),
	('legal_manager', ''),
	('legal_zip', ''),
	('legal_address', ''),
	('legal_tel', ''),
	('legal_tel_hours', ''),
	('legal_email', ''),
	('legal_extra_fees', '送料 全国一律800円（11,000円以上で無料）'),
	('legal_payment_methods', 'クレジットカード / Apple Pay / PayPay / コンビニ決済'),
	('legal_payment_timing', 'ご注文時にお支払いが確定します'),
	('legal_delivery_timing', 'ご注文から3営業日以内に発送'),
	('legal_return_policy', ''),
	('legal_return_shipping', ''),
	('legal_defect_policy', ''),
	-- 決済
	('payment_mode', 'mock'),
	('currency', 'JPY'),
	('tax_note', '表示価格はすべて税込です'),
	-- 通知
	('notify_order_to', ''),
	('notify_bcc', ''),
	('mail_from', ''),
	('mail_signature', ''),
	('notify_on_order', '1'),
	('notify_on_ship', '1'),
	-- 運用
	('low_stock_threshold', '3'),
	('order_prefix', 'SUI'),
	('timezone', 'Asia/Tokyo');
