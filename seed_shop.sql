-- Local-only sample products for development. Never run against production.
INSERT OR REPLACE INTO products (id, slug, name, spec, price, images, description, stock, status, created_at, updated_at) VALUES
('pr_sui01', 'sui-eau-de-parfum', '蕊 SUI Eau de Parfum', '50ml', 15000,
 '["/images/sari.jpg","/images/hanaori_1.jpg"]',
 '香道の記憶と現代の抽出技術をかさねた、SUIの中心となる一本。' || char(10) || '植物の静かな立ち上がりから、鉱物的な余韻へ。',
 12, 'published', '2026-07-01T00:00:00Z', '2026-07-01T00:00:00Z'),
('pr_sui02', 'hanaori-room-mist', '花折 Room Mist', '100ml', 6600,
 '["/images/hanaori_2.jpg"]',
 '空間にひと吹きで、香会のはじまりの空気をつくるルームミスト。',
 30, 'published', '2026-06-15T00:00:00Z', '2026-06-15T00:00:00Z'),
('pr_sui03', 'kaori-no-ki', '香の木 Incense', '20本入', 3300,
 '["/images/senn7.jpg","/images/senn15.jpg"]',
 '毎月すこしずつ調合を変えて仕立てる、その月だけのお香。',
 0, 'published', '2026-06-01T00:00:00Z', '2026-06-01T00:00:00Z'),
('pr_sui04', 'atelier-candle', 'Atelier Candle（8月分・下書き）', '180g', 8800,
 '["/images/roka.jpg"]',
 '来月のドロップ用。まだ公開しない。',
 20, 'draft', '2026-07-20T00:00:00Z', '2026-07-20T00:00:00Z');
