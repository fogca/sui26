-- Seed the two sample posts (run manually, not a numbered migration).
-- draft_blocks == published_blocks so the editor opens with current content.
INSERT OR REPLACE INTO pages (id, slug, title, date, cover, status, draft_blocks, published_blocks, updated_at, published_at) VALUES
('p_hello', 'hello-log', 'log をはじめます', '2026-07-14', '/images/sari.jpg', 'published',
 '[{"id":"b1","type":"title","text":"log をはじめます"},{"id":"b2","type":"text","text":"SUI scent studio の記録として、香会や制作のあしあとを少しずつ残していきます。\nここは、その最初のページです。"},{"id":"b3","type":"image","src":"/images/sari.jpg","alt":"","caption":"SUI scent by Sari"},{"id":"b4","type":"text","text":"文章と画像を、任意の順番で積み重ねていく。飾らない、静かな記録の場所にしたいと思います。"}]',
 '[{"id":"b1","type":"title","text":"log をはじめます"},{"id":"b2","type":"text","text":"SUI scent studio の記録として、香会や制作のあしあとを少しずつ残していきます。\nここは、その最初のページです。"},{"id":"b3","type":"image","src":"/images/sari.jpg","alt":"","caption":"SUI scent by Sari"},{"id":"b4","type":"text","text":"文章と画像を、任意の順番で積み重ねていく。飾らない、静かな記録の場所にしたいと思います。"}]',
 '2026-07-14', '2026-07-14'),
('p_morioka', 'morioka-shoten', '森岡書店にて', '2026-06-30', '/images/moriokasyoten2023.jpg', 'published',
 '[{"id":"b1","type":"title","text":"森岡書店にて"},{"id":"b2","type":"text","text":"一冊の本と一つの香り。小さな空間に立ちのぼる気配についての覚え書き。"},{"id":"b3","type":"image","src":"/images/moriokasyoten2023.jpg","alt":"","caption":"森岡書店 2023"},{"id":"b4","type":"image","src":"/images/hanaori_1.jpg","alt":"","caption":""}]',
 '[{"id":"b1","type":"title","text":"森岡書店にて"},{"id":"b2","type":"text","text":"一冊の本と一つの香り。小さな空間に立ちのぼる気配についての覚え書き。"},{"id":"b3","type":"image","src":"/images/moriokasyoten2023.jpg","alt":"","caption":"森岡書店 2023"},{"id":"b4","type":"image","src":"/images/hanaori_1.jpg","alt":"","caption":""}]',
 '2026-06-30', '2026-06-30');
