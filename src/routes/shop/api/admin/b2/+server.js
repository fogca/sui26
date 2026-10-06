import { listOrders, listOrdersByIds, getSettings } from '$lib/shop/store.js';

// Yamato B2 Cloud import CSV — official "基本レイアウト" (columns 1-42 of the
// data-exchange spec). 送り状種類 0 = 発払い.
// Without ?ids, every unshipped (paid) order is exported. With ?ids=a,b,c only
// those orders are, exactly as picked on the 受注 screen — no status filter, so
// what the owner selected is what lands in the file.
// Served as UTF-8 with BOM; if B2 shows mojibake, open in Excel and re-save
// as .xlsx before importing (B2 accepts xlsx and sidesteps encoding).

// Enough for any realistic batch; keeps a hand-typed URL from fanning out.
const MAX_IDS = 500;

// ?format= names the export layout. Only the Yamato B2 layout exists today;
// the parameter is here so a second one (e.g. another carrier's import CSV)
// can be added without changing this endpoint's URL or callers.
const FORMATS = ['b2'];
const DEFAULT_FORMAT = 'b2';

const HEADERS = [
	'お客様管理番号', '送り状種類', 'クール区分', '伝票番号', '出荷予定日',
	'お届け予定日', '配達時間帯', 'お届け先コード', 'お届け先電話番号', 'お届け先電話番号枝番',
	'お届け先郵便番号', 'お届け先住所', 'お届け先アパートマンション名', 'お届け先会社・部門名１', 'お届け先会社・部門名２',
	'お届け先名', 'お届け先名略称カナ', '敬称', 'ご依頼主コード', 'ご依頼主電話番号',
	'ご依頼主電話番号枝番', 'ご依頼主郵便番号', 'ご依頼主住所', 'ご依頼主アパートマンション名', 'ご依頼主名',
	'ご依頼主略称カナ', '品名コード１', '品名１', '品名コード２', '品名２',
	'荷扱い１', '荷扱い２', '記事', 'コレクト代金引換額（税込）', 'コレクト内消費税額等',
	'止置き', '営業所コード', '発行枚数', '個数口枠の印字', 'ご請求先顧客コード',
	'ご請求先分類コード', '運賃管理番号'
];

// our checkout slot values -> B2 delivery time-zone codes
const SLOT_CODE = { am: '0812', s1416: '1416', s1618: '1618', s1820: '1820', s1921: '1921' };

function esc(v) {
	let s = String(v ?? '');
	// CSV-injection guard: neutralize leading formula characters before the
	// file is ever opened in Excel (customer-controlled fields: name, address…)
	if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
	return /[",\n]/.test(s) ? '"' + s.replaceAll('"', '""') + '"' : s;
}

function todaySlash() {
	return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tokyo' })
		.format(new Date())
		.replaceAll('-', '/');
}

export async function GET({ platform, url }) {
	const db = platform.env.DB;
	const format = url.searchParams.get('format') ?? DEFAULT_FORMAT;
	if (!FORMATS.includes(format)) {
		return new Response(`unsupported format: ${format}`, { status: 400 });
	}
	// The presence of `ids` — not its contents — decides the mode, so a malformed
	// "?ids=" yields an empty file rather than silently dumping every open order.
	const raw = url.searchParams.get('ids');
	const ids =
		raw === null
			? null
			: raw
					.split(',')
					.map((s) => s.trim())
					.filter(Boolean)
					.slice(0, MAX_IDS);

	const [orders, settings] = await Promise.all([
		ids ? listOrdersByIds(db, ids) : listOrders(db, 'paid'),
		getSettings(db)
	]);
	const ship = todaySlash();

	const rows = orders.map((o) => {
		const a = o.address ?? {};
		const itemName = (s) => String(s ?? '').slice(0, 25);
		const row = new Array(42).fill('');
		row[0] = o.order_no; // お客様管理番号
		row[1] = '0'; // 発払い
		row[2] = '0'; // 通常(ドライ)
		row[4] = ship; // 出荷予定日 (必須)
		row[6] = SLOT_CODE[o.delivery_note] ?? ''; // 配達時間帯
		row[8] = o.phone; // お届け先電話 (必須)
		row[10] = a.zip ?? ''; // 郵便番号 (必須)
		row[11] = `${a.state ?? ''}${a.city ?? ''}${a.line1 ?? ''}`; // 住所 (必須)
		row[12] = a.line2 ?? ''; // 建物名
		row[15] = o.name; // お届け先名 (必須)
		row[19] = settings.sender_tel; // ご依頼主電話 (必須)
		row[21] = settings.sender_zip; // ご依頼主郵便番号 (必須)
		row[22] = settings.sender_addr; // ご依頼主住所 (必須)
		row[24] = settings.sender_name; // ご依頼主名 (必須)
		row[27] = itemName(o.items[0]?.name); // 品名1 (必須)
		row[29] =
			o.items.length === 2
				? itemName(o.items[1].name)
				: o.items.length > 2
					? `他${o.items.length - 1}点`
					: ''; // 品名2
		row[32] = o.gift ? 'ギフト' : ''; // 記事
		row[39] = settings.b2_customer_code; // ご請求先顧客コード (契約値・必須)
		row[41] = settings.b2_fare_no; // 運賃管理番号 (契約値・必須)
		return row.map(esc).join(',');
	});

	const csv = '﻿' + [HEADERS.join(','), ...rows].join('\r\n') + '\r\n';
	const stamp = todaySlash().replaceAll('/', '');
	// a selected batch gets its own filename so two downloads never collide
	const name = ids ? `b2_${stamp}_sel${rows.length}.csv` : `b2_${stamp}.csv`;
	return new Response(csv, {
		headers: {
			'Content-Type': 'text/csv; charset=utf-8',
			'Content-Disposition': `attachment; filename="${name}"`
		}
	});
}
