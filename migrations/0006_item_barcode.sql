-- Barcode (JAN/EAN/UPC) on items.
-- STORES exposes 品番 (sku) and バーコード as two separate identifiers, and the
-- client already keys their catalogue that way, so mirror it here rather than
-- overloading sku.
ALTER TABLE products ADD COLUMN barcode TEXT NOT NULL DEFAULT '';
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products (barcode);
