-- Demo data for the shop back office. FICTIONAL — every customer name is a
-- placeholder, emails use the reserved example.com domain, phone numbers use the
-- unallocated 090-0000 block, and every note carries a （デモデータ）marker.
-- NOT a numbered migration. Local development only:
--   wrangler d1 execute sui-sari-log --local --file=seed-demo-shop.sql
--
-- Dates are relative to the run date so the dashboard always has fresh data.
-- Rows are keyed with a *_demo_* prefix, so re-running replaces them cleanly
-- and production rows are never touched.
-- Requires seed-shop-products.sql (line items reference those product ids).

DELETE FROM orders WHERE id LIKE 'or_demo_%';
DELETE FROM stock_moves WHERE id LIKE 'sm_demo_%';
DELETE FROM activity_log WHERE id LIKE 'ac_demo_%';
DELETE FROM customer_notes WHERE email LIKE '%@example.com';

-- 25 orders spread over the last 60 days: 6 paid (unshipped) / 15 shipped /
-- 2 canceled / 2 refunded (one full, one partial). Several emails repeat so the
-- customer screen has real repeat buyers to show.
INSERT INTO orders (
	id, order_no, provider, session_id, payment_intent,
	items,
	subtotal, shipping, total,
	email, name, phone, address,
	delivery_note, gift, status, tracking_no, shipped_at,
	note, payment_method, refunded_amount, created_at
) VALUES
(
	'or_demo_01', 'SUI-' || substr(strftime('%Y%m%d', date('now','+9 hours','-0 days')),3) || '-DEMO01', 'mock', 'cs_demo_01', 'pi_demo_01',
	'[{"product_id":"pr_mori","name":"杜の響","price":15400,"qty":1}]',
	15400, 0, 15400,
	'hanako.yamada@example.com', '山田 花子', '090-0000-0011', '{"zip":"150-0001","state":"東京都","city":"渋谷区","line1":"神宮前1-1-1","line2":"サンプルレジデンス301"}',
	'am', 0, 'paid', '', NULL,
	'（デモデータ）', 'card', 0, strftime('%Y-%m-%dT%H:%M:%fZ', date('now','+9 hours','-0 days') || ' 09:12:00', '-9 hours')
),
(
	'or_demo_02', 'SUI-' || substr(strftime('%Y%m%d', date('now','+9 hours','-0 days')),3) || '-DEMO02', 'mock', 'cs_demo_02', 'pi_demo_02',
	'[{"product_id":"pr_sumire","name":"匂菫 2026（5ml）","price":43000,"qty":1}]',
	43000, 0, 43000,
	'misaki.tanaka@example.com', '田中 美咲', '090-0000-0044', '{"zip":"231-0023","state":"神奈川県","city":"横浜市中区","line1":"山下町3-3-3","line2":"サンプルハイツ102"}',
	'', 1, 'paid', '', NULL,
	'（デモデータ）' || char(10) || 'ギフト包装のご希望あり。', 'card', 0, strftime('%Y-%m-%dT%H:%M:%fZ', date('now','+9 hours','-0 days') || ' 11:48:00', '-9 hours')
),
(
	'or_demo_03', 'SUI-' || substr(strftime('%Y%m%d', date('now','+9 hours','-1 days')),3) || '-DEMO03', 'mock', 'cs_demo_03', 'pi_demo_03',
	'[{"product_id":"pr_drei3","name":"Drei 3 - forest","price":14300,"qty":1}]',
	14300, 0, 14300,
	'taro.sato@example.com', '佐藤 太郎', '090-0000-0022', '{"zip":"060-0001","state":"北海道","city":"札幌市中央区","line1":"北一条西2-2-2","line2":""}',
	's1921', 0, 'paid', '', NULL,
	'（デモデータ）', 'paypay', 0, strftime('%Y-%m-%dT%H:%M:%fZ', date('now','+9 hours','-1 days') || ' 20:31:00', '-9 hours')
),
(
	'or_demo_04', 'SUI-' || substr(strftime('%Y%m%d', date('now','+9 hours','-2 days')),3) || '-DEMO04', 'mock', 'cs_demo_04', 'pi_demo_04',
	'[{"product_id":"pr_kyara","name":"伽羅","price":17000,"qty":1},{"product_id":"pr_mori","name":"杜の響","price":15400,"qty":1}]',
	32400, 0, 32400,
	'yui.kobayashi@example.com', '小林 結衣', '090-0000-0099', '{"zip":"530-0001","state":"大阪府","city":"大阪市北区","line1":"梅田8-8-8","line2":""}',
	's1416', 0, 'paid', '', NULL,
	'（デモデータ）', 'card', 0, strftime('%Y-%m-%dT%H:%M:%fZ', date('now','+9 hours','-2 days') || ' 14:05:00', '-9 hours')
),
(
	'or_demo_05', 'SUI-' || substr(strftime('%Y%m%d', date('now','+9 hours','-3 days')),3) || '-DEMO05', 'mock', 'cs_demo_05', 'pi_demo_05',
	'[{"product_id":"pr_es","name":"es - your skin -（6ml）","price":15400,"qty":1}]',
	15400, 0, 15400,
	'akari.matsumoto@example.com', '松本 あかり', '090-0000-0111', '{"zip":"390-0811","state":"長野県","city":"松本市","line1":"中央1-2-3","line2":""}',
	'', 0, 'paid', '', NULL,
	'（デモデータ）' || char(10) || 'コンビニ入金の確認待ち。', 'konbini', 0, strftime('%Y-%m-%dT%H:%M:%fZ', date('now','+9 hours','-3 days') || ' 08:40:00', '-9 hours')
),
(
	'or_demo_06', 'SUI-' || substr(strftime('%Y%m%d', date('now','+9 hours','-5 days')),3) || '-DEMO06', 'mock', 'cs_demo_06', 'pi_demo_06',
	'[{"product_id":"pr_roubai","name":"蝋梅（5ml）","price":33000,"qty":1}]',
	33000, 0, 33000,
	'ichiro.suzuki@example.com', '鈴木 一郎', '090-0000-0033', '{"zip":"604-8005","state":"京都府","city":"京都市中京区","line1":"河原町通三条1-1","line2":"デモビル 4F"}',
	's1820', 1, 'paid', '', NULL,
	'（デモデータ）', 'card', 0, strftime('%Y-%m-%dT%H:%M:%fZ', date('now','+9 hours','-5 days') || ' 22:17:00', '-9 hours')
),
(
	'or_demo_07', 'SUI-' || substr(strftime('%Y%m%d', date('now','+9 hours','-6 days')),3) || '-DEMO07', 'mock', 'cs_demo_07', 'pi_demo_07',
	'[{"product_id":"pr_mori","name":"杜の響","price":15400,"qty":2}]',
	30800, 0, 30800,
	'misaki.tanaka@example.com', '田中 美咲', '090-0000-0044', '{"zip":"231-0023","state":"神奈川県","city":"横浜市中区","line1":"山下町3-3-3","line2":"サンプルハイツ102"}',
	'', 0, 'shipped', '0000-1049-2091', strftime('%Y-%m-%dT%H:%M:%fZ', date('now','+9 hours','-4 days') || ' 11:00:00', '-9 hours'),
	'（デモデータ）', 'card', 0, strftime('%Y-%m-%dT%H:%M:%fZ', date('now','+9 hours','-6 days') || ' 13:22:00', '-9 hours')
),
(
	'or_demo_08', 'SUI-' || substr(strftime('%Y%m%d', date('now','+9 hours','-8 days')),3) || '-DEMO08', 'mock', 'cs_demo_08', 'pi_demo_08',
	'[{"product_id":"pr_drei3","name":"Drei 3 - forest","price":14300,"qty":1}]',
	14300, 0, 14300,
	'yoko.watanabe@example.com', '渡辺 陽子', '090-0000-0077', '{"zip":"380-0824","state":"長野県","city":"長野市","line1":"南長野6-6-6","line2":""}',
	's1618', 0, 'shipped', '0000-1056-2104', strftime('%Y-%m-%dT%H:%M:%fZ', date('now','+9 hours','-6 days') || ' 11:00:00', '-9 hours'),
	'（デモデータ）', 'applepay', 0, strftime('%Y-%m-%dT%H:%M:%fZ', date('now','+9 hours','-8 days') || ' 19:03:00', '-9 hours')
),
(
	'or_demo_09', 'SUI-' || substr(strftime('%Y%m%d', date('now','+9 hours','-10 days')),3) || '-DEMO09', 'mock', 'cs_demo_09', 'pi_demo_09',
	'[{"product_id":"pr_kyara","name":"伽羅","price":17000,"qty":1}]',
	17000, 0, 17000,
	'kenta.takahashi@example.com', '高橋 健太', '090-0000-0055', '{"zip":"460-0008","state":"愛知県","city":"名古屋市中区","line1":"栄4-4-4","line2":""}',
	'', 0, 'canceled', '', NULL,
	'（デモデータ）' || char(10) || 'お客様都合によりキャンセル。在庫は戻した。', 'card', 0, strftime('%Y-%m-%dT%H:%M:%fZ', date('now','+9 hours','-10 days') || ' 10:55:00', '-9 hours')
),
(
	'or_demo_10', 'SUI-' || substr(strftime('%Y%m%d', date('now','+9 hours','-11 days')),3) || '-DEMO10', 'mock', 'cs_demo_10', 'pi_demo_10',
	'[{"product_id":"pr_es","name":"es - your skin -（6ml）","price":15400,"qty":1}]',
	15400, 0, 15400,
	'hanako.yamada@example.com', '山田 花子', '090-0000-0011', '{"zip":"150-0001","state":"東京都","city":"渋谷区","line1":"神宮前1-1-1","line2":"サンプルレジデンス301"}',
	'am', 0, 'shipped', '0000-1070-2130', strftime('%Y-%m-%dT%H:%M:%fZ', date('now','+9 hours','-9 days') || ' 11:00:00', '-9 hours'),
	'（デモデータ）', 'card', 0, strftime('%Y-%m-%dT%H:%M:%fZ', date('now','+9 hours','-11 days') || ' 16:41:00', '-9 hours')
),
(
	'or_demo_11', 'SUI-' || substr(strftime('%Y%m%d', date('now','+9 hours','-13 days')),3) || '-DEMO11', 'mock', 'cs_demo_11', 'pi_demo_11',
	'[{"product_id":"pr_3drei_a","name":"3 Drei（Collaboration）（A｜左下 ＋ perfume）","price":33000,"qty":1}]',
	33000, 0, 33000,
	'naoki.kato@example.com', '加藤 直樹', '090-0000-0101', '{"zip":"904-0301","state":"沖縄県","city":"中頭郡読谷村","line1":"儀間9-9-9","line2":"デモヴィラA"}',
	's1921', 1, 'shipped', '0000-1077-2143', strftime('%Y-%m-%dT%H:%M:%fZ', date('now','+9 hours','-11 days') || ' 11:00:00', '-9 hours'),
	'（デモデータ）' || char(10) || '離島のため中一日追加。', 'card', 0, strftime('%Y-%m-%dT%H:%M:%fZ', date('now','+9 hours','-13 days') || ' 21:09:00', '-9 hours')
),
(
	'or_demo_12', 'SUI-' || substr(strftime('%Y%m%d', date('now','+9 hours','-15 days')),3) || '-DEMO12', 'mock', 'cs_demo_12', 'pi_demo_12',
	'[{"product_id":"pr_drei3","name":"Drei 3 - forest","price":14300,"qty":1}]',
	14300, 0, 14300,
	'yui.kobayashi@example.com', '小林 結衣', '090-0000-0099', '{"zip":"530-0001","state":"大阪府","city":"大阪市北区","line1":"梅田8-8-8","line2":""}',
	'', 0, 'shipped', '0000-1084-2156', strftime('%Y-%m-%dT%H:%M:%fZ', date('now','+9 hours','-13 days') || ' 11:00:00', '-9 hours'),
	'（デモデータ）', 'paypay', 0, strftime('%Y-%m-%dT%H:%M:%fZ', date('now','+9 hours','-15 days') || ' 12:33:00', '-9 hours')
),
(
	'or_demo_13', 'SUI-' || substr(strftime('%Y%m%d', date('now','+9 hours','-17 days')),3) || '-DEMO13', 'mock', 'cs_demo_13', 'pi_demo_13',
	'[{"product_id":"pr_sumire","name":"匂菫 2026（5ml）","price":43000,"qty":1}]',
	43000, 0, 43000,
	'osamu.inoue@example.com', '井上 修', '090-0000-0122', '{"zip":"730-0011","state":"広島県","city":"広島市中区","line1":"基町2-3-4","line2":"サンプルパーク505"}',
	's1416', 0, 'refunded', '0000-1091-2169', strftime('%Y-%m-%dT%H:%M:%fZ', date('now','+9 hours','-15 days') || ' 11:00:00', '-9 hours'),
	'（デモデータ）' || char(10) || '全額返金済み（Stripe管理画面で処理）。', 'card', 43000, strftime('%Y-%m-%dT%H:%M:%fZ', date('now','+9 hours','-17 days') || ' 15:27:00', '-9 hours')
),
(
	'or_demo_14', 'SUI-' || substr(strftime('%Y%m%d', date('now','+9 hours','-18 days')),3) || '-DEMO14', 'mock', 'cs_demo_14', 'pi_demo_14',
	'[{"product_id":"pr_mori","name":"杜の響","price":15400,"qty":1}]',
	15400, 0, 15400,
	'taro.sato@example.com', '佐藤 太郎', '090-0000-0022', '{"zip":"060-0001","state":"北海道","city":"札幌市中央区","line1":"北一条西2-2-2","line2":""}',
	'am', 0, 'shipped', '0000-1098-2182', strftime('%Y-%m-%dT%H:%M:%fZ', date('now','+9 hours','-16 days') || ' 11:00:00', '-9 hours'),
	'（デモデータ）', 'card', 0, strftime('%Y-%m-%dT%H:%M:%fZ', date('now','+9 hours','-18 days') || ' 09:58:00', '-9 hours')
),
(
	'or_demo_15', 'SUI-' || substr(strftime('%Y%m%d', date('now','+9 hours','-20 days')),3) || '-DEMO15', 'mock', 'cs_demo_15', 'pi_demo_15',
	'[{"product_id":"pr_roubai","name":"蝋梅（5ml）","price":33000,"qty":1},{"product_id":"pr_es","name":"es - your skin -（6ml）","price":15400,"qty":1}]',
	48400, 0, 48400,
	'misaki.tanaka@example.com', '田中 美咲', '090-0000-0044', '{"zip":"231-0023","state":"神奈川県","city":"横浜市中区","line1":"山下町3-3-3","line2":"サンプルハイツ102"}',
	's1820', 1, 'shipped', '0000-1105-2195', strftime('%Y-%m-%dT%H:%M:%fZ', date('now','+9 hours','-18 days') || ' 11:00:00', '-9 hours'),
	'（デモデータ）', 'card', 0, strftime('%Y-%m-%dT%H:%M:%fZ', date('now','+9 hours','-20 days') || ' 18:14:00', '-9 hours')
),
(
	'or_demo_16', 'SUI-' || substr(strftime('%Y%m%d', date('now','+9 hours','-23 days')),3) || '-DEMO16', 'mock', 'cs_demo_16', 'pi_demo_16',
	'[{"product_id":"pr_kuromoji","name":"kuromoji - 月の響 -（5ml）","price":15400,"qty":1}]',
	15400, 0, 15400,
	'sakura.ito@example.com', '伊藤 さくら', '090-0000-0066', '{"zip":"810-0001","state":"福岡県","city":"福岡市中央区","line1":"天神5-5-5","line2":"デモコート701"}',
	'', 0, 'shipped', '0000-1112-2208', strftime('%Y-%m-%dT%H:%M:%fZ', date('now','+9 hours','-21 days') || ' 11:00:00', '-9 hours'),
	'（デモデータ）', 'konbini', 0, strftime('%Y-%m-%dT%H:%M:%fZ', date('now','+9 hours','-23 days') || ' 11:02:00', '-9 hours')
),
(
	'or_demo_17', 'SUI-' || substr(strftime('%Y%m%d', date('now','+9 hours','-25 days')),3) || '-DEMO17', 'mock', 'cs_demo_17', 'pi_demo_17',
	'[{"product_id":"pr_drei3","name":"Drei 3 - forest","price":14300,"qty":1}]',
	14300, 0, 14300,
	'ichiro.suzuki@example.com', '鈴木 一郎', '090-0000-0033', '{"zip":"604-8005","state":"京都府","city":"京都市中京区","line1":"河原町通三条1-1","line2":"デモビル 4F"}',
	's1921', 0, 'shipped', '0000-1119-2221', strftime('%Y-%m-%dT%H:%M:%fZ', date('now','+9 hours','-23 days') || ' 11:00:00', '-9 hours'),
	'（デモデータ）', 'card', 0, strftime('%Y-%m-%dT%H:%M:%fZ', date('now','+9 hours','-25 days') || ' 20:46:00', '-9 hours')
),
(
	'or_demo_18', 'SUI-' || substr(strftime('%Y%m%d', date('now','+9 hours','-27 days')),3) || '-DEMO18', 'mock', 'cs_demo_18', 'pi_demo_18',
	'[{"product_id":"pr_mori","name":"杜の響","price":15400,"qty":1}]',
	15400, 0, 15400,
	'yoko.watanabe@example.com', '渡辺 陽子', '090-0000-0077', '{"zip":"380-0824","state":"長野県","city":"長野市","line1":"南長野6-6-6","line2":""}',
	's1416', 0, 'shipped', '0000-1126-2234', strftime('%Y-%m-%dT%H:%M:%fZ', date('now','+9 hours','-25 days') || ' 11:00:00', '-9 hours'),
	'（デモデータ）', 'card', 0, strftime('%Y-%m-%dT%H:%M:%fZ', date('now','+9 hours','-27 days') || ' 14:38:00', '-9 hours')
),
(
	'or_demo_19', 'SUI-' || substr(strftime('%Y%m%d', date('now','+9 hours','-30 days')),3) || '-DEMO19', 'mock', 'cs_demo_19', 'pi_demo_19',
	'[{"product_id":"pr_3drei_b","name":"3 Drei（Collaboration）（B｜中央 ＋ perfume）","price":33000,"qty":1}]',
	33000, 0, 33000,
	'daisuke.nakamura@example.com', '中村 大輔', '090-0000-0088', '{"zip":"980-0021","state":"宮城県","city":"仙台市青葉区","line1":"中央7-7-7","line2":"サンプルタワー1503"}',
	's1618', 0, 'shipped', '0000-1133-2247', strftime('%Y-%m-%dT%H:%M:%fZ', date('now','+9 hours','-28 days') || ' 11:00:00', '-9 hours'),
	'（デモデータ）', 'applepay', 0, strftime('%Y-%m-%dT%H:%M:%fZ', date('now','+9 hours','-30 days') || ' 17:20:00', '-9 hours')
),
(
	'or_demo_20', 'SUI-' || substr(strftime('%Y%m%d', date('now','+9 hours','-33 days')),3) || '-DEMO20', 'mock', 'cs_demo_20', 'pi_demo_20',
	'[{"product_id":"pr_es","name":"es - your skin -（6ml）","price":15400,"qty":1}]',
	15400, 0, 15400,
	'yui.kobayashi@example.com', '小林 結衣', '090-0000-0099', '{"zip":"530-0001","state":"大阪府","city":"大阪市北区","line1":"梅田8-8-8","line2":""}',
	'am', 0, 'canceled', '', NULL,
	'（デモデータ）' || char(10) || '二重注文のためキャンセル。', 'card', 0, strftime('%Y-%m-%dT%H:%M:%fZ', date('now','+9 hours','-33 days') || ' 10:11:00', '-9 hours')
),
(
	'or_demo_21', 'SUI-' || substr(strftime('%Y%m%d', date('now','+9 hours','-36 days')),3) || '-DEMO21', 'mock', 'cs_demo_21', 'pi_demo_21',
	'[{"product_id":"pr_kyara","name":"伽羅","price":17000,"qty":1}]',
	17000, 0, 17000,
	'hanako.yamada@example.com', '山田 花子', '090-0000-0011', '{"zip":"150-0001","state":"東京都","city":"渋谷区","line1":"神宮前1-1-1","line2":"サンプルレジデンス301"}',
	's1820', 0, 'shipped', '0000-1147-2273', strftime('%Y-%m-%dT%H:%M:%fZ', date('now','+9 hours','-34 days') || ' 11:00:00', '-9 hours'),
	'（デモデータ）', 'card', 0, strftime('%Y-%m-%dT%H:%M:%fZ', date('now','+9 hours','-36 days') || ' 19:52:00', '-9 hours')
),
(
	'or_demo_22', 'SUI-' || substr(strftime('%Y%m%d', date('now','+9 hours','-39 days')),3) || '-DEMO22', 'mock', 'cs_demo_22', 'pi_demo_22',
	'[{"product_id":"pr_drei3","name":"Drei 3 - forest","price":14300,"qty":1}]',
	14300, 0, 14300,
	'naoki.kato@example.com', '加藤 直樹', '090-0000-0101', '{"zip":"904-0301","state":"沖縄県","city":"中頭郡読谷村","line1":"儀間9-9-9","line2":"デモヴィラA"}',
	'', 0, 'shipped', '0000-1154-2286', strftime('%Y-%m-%dT%H:%M:%fZ', date('now','+9 hours','-37 days') || ' 11:00:00', '-9 hours'),
	'（デモデータ）', 'card', 0, strftime('%Y-%m-%dT%H:%M:%fZ', date('now','+9 hours','-39 days') || ' 13:07:00', '-9 hours')
),
(
	'or_demo_23', 'SUI-' || substr(strftime('%Y%m%d', date('now','+9 hours','-43 days')),3) || '-DEMO23', 'mock', 'cs_demo_23', 'pi_demo_23',
	'[{"product_id":"pr_mori","name":"杜の響","price":15400,"qty":1}]',
	15400, 0, 15400,
	'kenta.takahashi@example.com', '高橋 健太', '090-0000-0055', '{"zip":"460-0008","state":"愛知県","city":"名古屋市中区","line1":"栄4-4-4","line2":""}',
	's1618', 0, 'refunded', '0000-1161-2299', strftime('%Y-%m-%dT%H:%M:%fZ', date('now','+9 hours','-41 days') || ' 11:00:00', '-9 hours'),
	'（デモデータ）' || char(10) || '外箱の傷みにつき一部返金。', 'card', 5400, strftime('%Y-%m-%dT%H:%M:%fZ', date('now','+9 hours','-43 days') || ' 16:29:00', '-9 hours')
),
(
	'or_demo_24', 'SUI-' || substr(strftime('%Y%m%d', date('now','+9 hours','-48 days')),3) || '-DEMO24', 'mock', 'cs_demo_24', 'pi_demo_24',
	'[{"product_id":"pr_3drei_c","name":"3 Drei（Collaboration）（C｜右上 ＋ perfume）","price":33000,"qty":1}]',
	33000, 0, 33000,
	'taro.sato@example.com', '佐藤 太郎', '090-0000-0022', '{"zip":"060-0001","state":"北海道","city":"札幌市中央区","line1":"北一条西2-2-2","line2":""}',
	's1921', 1, 'shipped', '0000-1168-2312', strftime('%Y-%m-%dT%H:%M:%fZ', date('now','+9 hours','-46 days') || ' 11:00:00', '-9 hours'),
	'（デモデータ）', 'card', 0, strftime('%Y-%m-%dT%H:%M:%fZ', date('now','+9 hours','-48 days') || ' 21:44:00', '-9 hours')
),
(
	'or_demo_25', 'SUI-' || substr(strftime('%Y%m%d', date('now','+9 hours','-55 days')),3) || '-DEMO25', 'mock', 'cs_demo_25', 'pi_demo_25',
	'[{"product_id":"pr_kuromoji","name":"kuromoji - 月の響 -（5ml）","price":15400,"qty":1}]',
	15400, 0, 15400,
	'misaki.tanaka@example.com', '田中 美咲', '090-0000-0044', '{"zip":"231-0023","state":"神奈川県","city":"横浜市中区","line1":"山下町3-3-3","line2":"サンプルハイツ102"}',
	'', 0, 'shipped', '0000-1175-2325', strftime('%Y-%m-%dT%H:%M:%fZ', date('now','+9 hours','-53 days') || ' 11:00:00', '-9 hours'),
	'（デモデータ）', 'card', 0, strftime('%Y-%m-%dT%H:%M:%fZ', date('now','+9 hours','-55 days') || ' 12:19:00', '-9 hours')
);

-- Stock ledger entries (deliveries, stock-take corrections, event withdrawals).
INSERT INTO stock_moves (id, product_id, delta, reason, actor, created_at) VALUES
('sm_demo_01', 'pr_mori', 6, '入荷（蒸留分）（デモデータ）', 'admin', strftime('%Y-%m-%dT%H:%M:%fZ', date('now','+9 hours','-40 days') || ' 10:00:00', '-9 hours')),
('sm_demo_02', 'pr_drei3', 8, '入荷（デモデータ）', 'admin', strftime('%Y-%m-%dT%H:%M:%fZ', date('now','+9 hours','-38 days') || ' 10:00:00', '-9 hours')),
('sm_demo_03', 'pr_kyara', 3, '入荷（デモデータ）', 'admin', strftime('%Y-%m-%dT%H:%M:%fZ', date('now','+9 hours','-31 days') || ' 10:00:00', '-9 hours')),
('sm_demo_04', 'pr_es', 4, '入荷（デモデータ）', 'admin', strftime('%Y-%m-%dT%H:%M:%fZ', date('now','+9 hours','-26 days') || ' 10:00:00', '-9 hours')),
('sm_demo_05', 'pr_roubai', 2, '入荷（少量）（デモデータ）', 'admin', strftime('%Y-%m-%dT%H:%M:%fZ', date('now','+9 hours','-22 days') || ' 10:00:00', '-9 hours')),
('sm_demo_06', 'pr_mori', -1, '棚卸し調整（破損）（デモデータ）', 'admin', strftime('%Y-%m-%dT%H:%M:%fZ', date('now','+9 hours','-19 days') || ' 10:00:00', '-9 hours')),
('sm_demo_07', 'pr_sumire', 1, '入荷（デモデータ）', 'admin', strftime('%Y-%m-%dT%H:%M:%fZ', date('now','+9 hours','-15 days') || ' 10:00:00', '-9 hours')),
('sm_demo_08', 'pr_es', -1, '撮影用サンプルへ振替（デモデータ）', 'admin', strftime('%Y-%m-%dT%H:%M:%fZ', date('now','+9 hours','-12 days') || ' 10:00:00', '-9 hours')),
('sm_demo_09', 'pr_kuromoji', 5, '入荷（デモデータ）', 'admin', strftime('%Y-%m-%dT%H:%M:%fZ', date('now','+9 hours','-8 days') || ' 10:00:00', '-9 hours')),
('sm_demo_10', 'pr_drei3', -2, '催事持ち出し（デモデータ）', 'admin', strftime('%Y-%m-%dT%H:%M:%fZ', date('now','+9 hours','-4 days') || ' 10:00:00', '-9 hours'));

-- Operation log.
INSERT INTO activity_log (id, at, actor, action, target, detail) VALUES
('ac_demo_01', strftime('%Y-%m-%dT%H:%M:%fZ', date('now','+9 hours','-0 days') || ' 09:13:00', '-9 hours'), 'system', 'order.paid', 'SUI-DEMO01', '¥15,400（デモデータ）'),
('ac_demo_02', strftime('%Y-%m-%dT%H:%M:%fZ', date('now','+9 hours','-0 days') || ' 11:49:00', '-9 hours'), 'system', 'order.paid', 'SUI-DEMO02', '¥43,000（デモデータ）'),
('ac_demo_03', strftime('%Y-%m-%dT%H:%M:%fZ', date('now','+9 hours','-1 days') || ' 09:05:00', '-9 hours'), 'admin', 'order.ship', 'SUI-DEMO07', '0000-1049-2091（デモデータ）'),
('ac_demo_04', strftime('%Y-%m-%dT%H:%M:%fZ', date('now','+9 hours','-2 days') || ' 10:22:00', '-9 hours'), 'admin', 'product.update', 'pr_mori', '杜の響（デモデータ）'),
('ac_demo_05', strftime('%Y-%m-%dT%H:%M:%fZ', date('now','+9 hours','-4 days') || ' 16:40:00', '-9 hours'), 'admin', 'stock.adjust', 'pr_drei3', '-2 → 5 / 催事持ち出し（デモデータ）'),
('ac_demo_06', strftime('%Y-%m-%dT%H:%M:%fZ', date('now','+9 hours','-6 days') || ' 11:15:00', '-9 hours'), 'admin', 'settings.save', '6項目', 'ship_days_note shipping_fee（デモデータ）'),
('ac_demo_07', strftime('%Y-%m-%dT%H:%M:%fZ', date('now','+9 hours','-8 days') || ' 13:02:00', '-9 hours'), 'admin', 'order.bulk_ship', '3件', 'まとめて発送処理（デモデータ）'),
('ac_demo_08', strftime('%Y-%m-%dT%H:%M:%fZ', date('now','+9 hours','-10 days') || ' 10:58:00', '-9 hours'), 'admin', 'order.cancel', 'SUI-DEMO09', '在庫を戻した（デモデータ）'),
('ac_demo_09', strftime('%Y-%m-%dT%H:%M:%fZ', date('now','+9 hours','-12 days') || ' 15:33:00', '-9 hours'), 'admin', 'customer.note', 'misaki.tanaka@example.com', '（デモデータ）'),
('ac_demo_10', strftime('%Y-%m-%dT%H:%M:%fZ', date('now','+9 hours','-15 days') || ' 09:47:00', '-9 hours'), 'admin', 'product.create', 'pr_kuromoji', 'kuromoji - 月の響 -（デモデータ）'),
('ac_demo_11', strftime('%Y-%m-%dT%H:%M:%fZ', date('now','+9 hours','-17 days') || ' 15:30:00', '-9 hours'), 'admin', 'order.refund', 'SUI-DEMO13', '¥43,000 / 全額返金（デモデータ）'),
('ac_demo_12', strftime('%Y-%m-%dT%H:%M:%fZ', date('now','+9 hours','-21 days') || ' 12:08:00', '-9 hours'), 'admin', 'product.bulk_status', '2件', 'published（デモデータ）'),
('ac_demo_13', strftime('%Y-%m-%dT%H:%M:%fZ', date('now','+9 hours','-26 days') || ' 17:25:00', '-9 hours'), 'admin', 'stock.adjust', 'pr_es', '+4 → 4 / 入荷（デモデータ）'),
('ac_demo_14', strftime('%Y-%m-%dT%H:%M:%fZ', date('now','+9 hours','-31 days') || ' 10:41:00', '-9 hours'), 'admin', 'product.duplicate', 'pr_3drei_b', '3 Drei（Collaboration）（デモデータ）'),
('ac_demo_15', strftime('%Y-%m-%dT%H:%M:%fZ', date('now','+9 hours','-43 days') || ' 16:31:00', '-9 hours'), 'admin', 'order.refund', 'SUI-DEMO23', '¥5,400 / 一部返金（デモデータ）');

-- Private memos on a few customers.
INSERT INTO customer_notes (email, note, tags, updated_at) VALUES
('misaki.tanaka@example.com', '毎シーズンご購入いただいているお客様。ギフト包装をよく希望される。（デモデータ）', '["リピーター","ギフト"]', strftime('%Y-%m-%dT%H:%M:%fZ', date('now','+9 hours','-9 days') || ' 10:00:00', '-9 hours')),
('hanako.yamada@example.com', '直筆のお手紙を同封すると喜ばれる。（デモデータ）', '["リピーター"]', strftime('%Y-%m-%dT%H:%M:%fZ', date('now','+9 hours','-9 days') || ' 10:00:00', '-9 hours')),
('osamu.inoue@example.com', '香りが合わず全額返金。次回は試香のご案内から。（デモデータ）', '["返金あり"]', strftime('%Y-%m-%dT%H:%M:%fZ', date('now','+9 hours','-9 days') || ' 10:00:00', '-9 hours'));
