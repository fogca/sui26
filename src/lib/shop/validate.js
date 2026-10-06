// Parse + validate the product form (shared by the create / edit actions).
//
// Returns { error, errors, values }
//   error  — the first message, for the banner at the top of the form
//   errors — per-field messages keyed by input name, shown under each field
//   values — everything that was submitted, so a rejected form re-renders as
//            the owner typed it (nothing is silently dropped or corrected)

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const INT_RE = /^-?\d+$/;
// path segments under /shop/ that products must not shadow
const RESERVED = ['edit', 'api', 'new', 'thanks', 'legal', 'mock-checkout'];

// Bounds follow STORES' own item limits where STORES publishes one, so a shop
// migrated from STORES can never enter something here that STORES would have
// rejected (and vice versa). The rest are typo guards, not business rules.
const MAX_NAME = 100; // STORES: item name, 100 chars
const MAX_SLUG = 80;
const MAX_SPEC = 60;
const MAX_SKU = 64;
const MAX_CATEGORY = 40;
const MAX_TAGS = 10;
const MAX_TAG = 24;
const MAX_TAGS_TOTAL = 100; // STORES: admin tags field, 100 chars in total
const MAX_DESCRIPTION = 8000;
const MAX_SEO_TITLE = 120;
const MAX_SEO_DESCRIPTION = 300;
const MAX_PRICE = 2000000; // STORES: price, 0 - 2,000,000 JPY
const MAX_STOCK = 9999; // STORES: stock, 9,999 or fewer
const MAX_WEIGHT_G = 100000;
const MIN_PER_ORDER = 1;
const MAX_PER_ORDER = 99;
const MAX_SORT_ORDER = 9999;
const MAX_IMAGES = 12;

export const DEFAULT_MAX_PER_ORDER = 9;

function text(form, key) {
	return String(form.get(key) ?? '').trim();
}

/** '' -> `fallback`. A non-integer string comes back unchanged, so the form can
 *  re-render exactly what was typed while the field reports the problem. */
function integer(raw, fallback) {
	const s = String(raw ?? '').trim();
	if (s === '') return fallback;
	return INT_RE.test(s) ? parseInt(s, 10) : s;
}

function inRange(value, min, max) {
	return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
}

function num(n) {
	return Number(n).toLocaleString('ja-JP');
}

/** "木質, 花 ,, 木質" -> ['木質', '花'] — trimmed, blanks dropped, deduped. */
export function parseTags(raw) {
	const out = [];
	for (const part of String(raw ?? '').split(',')) {
		const tag = part.trim();
		if (tag && !out.includes(tag)) out.push(tag);
	}
	return out;
}

/** Images arrive as a JSON array of URLs written by the upload widget. */
function parseImages(raw) {
	try {
		const parsed = JSON.parse(String(raw ?? '[]'));
		if (!Array.isArray(parsed)) return [];
		const out = [];
		for (const src of parsed) {
			if (typeof src !== 'string' || src.trim() === '' || out.includes(src)) continue;
			out.push(src);
			if (out.length === MAX_IMAGES) break;
		}
		return out;
	} catch {
		return []; // malformed payload is treated as "no images"
	}
}

export function parseProductForm(form) {
	const values = {
		// 基本情報
		name: text(form, 'name'),
		slug: text(form, 'slug'),
		spec: text(form, 'spec'),
		sku: text(form, 'sku'),
		barcode: text(form, 'barcode'),
		category: text(form, 'category'),
		tags: parseTags(form.get('tags')),
		// 価格と在庫
		price: integer(form.get('price'), ''),
		cost: integer(form.get('cost'), 0),
		stock: integer(form.get('stock'), ''),
		max_per_order: integer(form.get('max_per_order'), DEFAULT_MAX_PER_ORDER),
		// 説明・画像
		description: String(form.get('description') ?? ''),
		images: parseImages(form.get('images')),
		// 配送
		weight_g: integer(form.get('weight_g'), 0),
		// SEO
		seo_title: text(form, 'seo_title'),
		seo_description: text(form, 'seo_description'),
		// 公開設定
		status: text(form, 'status') || 'draft',
		sort_order: integer(form.get('sort_order'), 0)
	};

	const errors = {};

	// --- 基本情報 -----------------------------------------------------------
	if (!values.name) errors.name = 'アイテム名を入力してください';
	else if (values.name.length > MAX_NAME)
		errors.name = `アイテム名は${MAX_NAME}文字以内で入力してください（現在 ${values.name.length} 文字）`;

	if (!values.slug) errors.slug = 'slug を入力してください';
	else if (values.slug.length > MAX_SLUG) errors.slug = `slug は${MAX_SLUG}文字以内で入力してください`;
	else if (!SLUG_RE.test(values.slug)) errors.slug = 'slug は半角英数字とハイフンのみ（例: sui-eau-de-parfum）';
	else if (RESERVED.includes(values.slug)) errors.slug = 'その slug は予約されています';

	if (values.spec.length > MAX_SPEC) errors.spec = `仕様は${MAX_SPEC}文字以内で入力してください`;
	if (values.sku.length > MAX_SKU) errors.sku = `品番は${MAX_SKU}文字以内で入力してください`;
	// Barcodes are JAN/EAN/UPC style: digits only, and long enough to be real.
	if (values.barcode) {
		if (!/^\d{8,14}$/.test(values.barcode))
			errors.barcode = 'バーコードは8〜14桁の数字で入力してください（JAN/EAN/UPC）';
	}
	if (values.category.length > MAX_CATEGORY)
		errors.category = `カテゴリは${MAX_CATEGORY}文字以内で入力してください`;

	// Admin tags: STORES caps the whole field at 100 characters, so measure the
	// text as typed (commas included) rather than only the individual tags.
	const tagsLength = values.tags.join(', ').length;
	if (values.tags.length > MAX_TAGS)
		errors.tags = `管理用タグは最大${MAX_TAGS}個までです（現在 ${values.tags.length} 個）`;
	else if (values.tags.some((t) => t.length > MAX_TAG))
		errors.tags = `管理用タグは1つあたり${MAX_TAG}文字以内で入力してください`;
	else if (tagsLength > MAX_TAGS_TOTAL)
		errors.tags = `管理用タグは全体で${MAX_TAGS_TOTAL}文字以内で入力してください（現在 ${tagsLength} 文字）`;

	// --- 価格と在庫 ---------------------------------------------------------
	if (values.price === '') errors.price = '価格を入力してください';
	else if (!inRange(values.price, 0, MAX_PRICE))
		errors.price = `価格は 0 〜 ${num(MAX_PRICE)} の整数で入力してください`;

	if (!inRange(values.cost, 0, MAX_PRICE))
		errors.cost = `原価は 0 〜 ${num(MAX_PRICE)} の整数で入力してください`;

	if (values.stock === '') errors.stock = '在庫を入力してください';
	else if (!inRange(values.stock, 0, MAX_STOCK))
		errors.stock = `在庫は 0 〜 ${num(MAX_STOCK)} の整数で入力してください`;

	if (!inRange(values.max_per_order, MIN_PER_ORDER, MAX_PER_ORDER))
		errors.max_per_order = `1注文あたり上限は ${MIN_PER_ORDER} 〜 ${MAX_PER_ORDER} で入力してください`;

	// --- 説明・配送・SEO ----------------------------------------------------
	if (!values.description.trim()) errors.description = 'アイテム説明を入力してください';
	else if (values.description.length > MAX_DESCRIPTION)
		errors.description = `アイテム説明は${num(MAX_DESCRIPTION)}文字以内で入力してください`;

	// STORES will not publish an item without a picture, and neither will we —
	// an item with no image reads as broken on the shop front.
	if (values.images.length === 0)
		errors.images = 'アイテム画像を1枚以上追加してください（1枚目がメイン画像になります）';

	if (!inRange(values.weight_g, 0, MAX_WEIGHT_G))
		errors.weight_g = `重量は 0 〜 ${num(MAX_WEIGHT_G)} g で入力してください`;

	if (values.seo_title.length > MAX_SEO_TITLE)
		errors.seo_title = `SEO タイトルは${MAX_SEO_TITLE}文字以内で入力してください`;
	if (values.seo_description.length > MAX_SEO_DESCRIPTION)
		errors.seo_description = `SEO ディスクリプションは${MAX_SEO_DESCRIPTION}文字以内で入力してください`;

	// --- 公開設定 -----------------------------------------------------------
	if (!['draft', 'published'].includes(values.status)) errors.status = '公開状態が不正です';

	if (!inRange(values.sort_order, -MAX_SORT_ORDER, MAX_SORT_ORDER))
		errors.sort_order = `並び順は -${num(MAX_SORT_ORDER)} 〜 ${num(MAX_SORT_ORDER)} で入力してください`;

	const first = Object.values(errors)[0] ?? null;
	return { error: first, errors, values };
}
