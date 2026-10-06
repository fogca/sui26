import { fail, redirect } from '@sveltejs/kit';
import { itemStatusLabel } from '$lib/shop/vocab.js';
import {
	adjustStock,
	bulkSetProductStatus,
	duplicateProduct,
	getProductById,
	getSettings,
	listCategories,
	listProductsPaged
} from '$lib/shop/store.js';

// Every filter lives in the query string, so a view can be bookmarked, shared
// and restored by the back button. Nothing here is kept in component state.

const PER_PAGE = 20;

// Only the orderings the store actually implements, so a hand-edited query
// string can never fall through to an ordering nobody chose.
const SORTS = new Set(['new', 'name', 'high', 'stock']);
const STATUSES = new Set(['published', 'draft']);


// Reason written to the stock ledger for edits made from this screen.
const ADJUST_REASON = '手動調整';

// STORES caps stock at 9,999; mirrored from validate.js.
const MAX_STOCK = 9999;

// Page size / safety stop used while narrowing by category (see listByCategory).
const SCAN_PER_PAGE = 200;
const SCAN_MAX_PAGES = 50;

/**
 * listProductsPaged has no category filter, and store.js is shared with the
 * other admin screens, so the narrowing happens here instead: walk the pages
 * the store already searched and sorted, keep the rows in this category, then
 * cut the requested page out of them. Search behaviour and ordering stay
 * identical to the unfiltered list, and for a catalogue this size it is a
 * single round trip.
 */
async function listByCategory(db, { q, status, sort, category, page, perPage }) {
	const matched = [];
	for (let p = 1; p <= SCAN_MAX_PAGES; p++) {
		const chunk = await listProductsPaged(db, { q, status, sort, page: p, perPage: SCAN_PER_PAGE });
		for (const product of chunk.products) {
			if (product.category === category) matched.push(product);
		}
		if (p >= chunk.pages) break;
	}
	const total = matched.length;
	const pages = Math.max(1, Math.ceil(total / perPage));
	const current = Math.min(Math.max(1, page), pages);
	const offset = (current - 1) * perPage;
	return {
		products: matched.slice(offset, offset + perPage),
		total,
		page: current,
		perPage,
		pages
	};
}

export async function load({ platform, url }) {
	const db = platform.env.DB;
	const p = url.searchParams;

	const q = (p.get('q') ?? '').trim();
	const rawStatus = p.get('status') ?? '';
	const status = STATUSES.has(rawStatus) ? rawStatus : '';
	const category = (p.get('category') ?? '').trim();
	const rawSort = p.get('sort') ?? '';
	const sort = SORTS.has(rawSort) ? rawSort : 'new';
	const page = Math.max(1, Number(p.get('page')) || 1);

	const query = { q, status: status || null, sort, page, perPage: PER_PAGE };
	const [listed, categories, settings] = await Promise.all([
		category ? listByCategory(db, { ...query, category }) : listProductsPaged(db, query),
		listCategories(db),
		getSettings(db)
	]);

	return {
		...listed,
		categories,
		// drives the warn colour on the stock column
		lowStockThreshold: settings.low_stock_threshold,
		query: { q, status, category, sort }
	};
}

export const actions = {
	// Publish / unpublish the ticked rows. bulkSetProductStatus reports how many
	// rows it actually touched, so a stale selection (a product deleted in
	// another tab) is reported rather than silently counted as done.
	bulkStatus: async ({ request, platform }) => {
		const form = await request.formData();
		const ids = form.getAll('ids').map(String).filter(Boolean);
		const status = String(form.get('status') ?? '');

		if (!STATUSES.has(status)) return fail(400, { error: '不明な操作です。' });
		if (!ids.length) return fail(400, { error: 'アイテムが選択されていません。' });

		const changed = await bulkSetProductStatus(platform.env.DB, ids, status);
		if (!changed) return fail(404, { error: '対象のアイテムが見つかりませんでした。' });
		return {
			message:
				`${changed}件を${itemStatusLabel(status)}にしました。` +
				(changed < ids.length ? `（${ids.length - changed}件は見つかりませんでした）` : '')
		};
	},

	// Inline stock edit. The form sends the quantity the owner wants to end up
	// with, not a delta — that is what they typed and what they expect to see.
	adjustStock: async ({ request, platform }) => {
		const db = platform.env.DB;
		const form = await request.formData();
		const id = String(form.get('id') ?? '');
		const raw = String(form.get('stock') ?? '').trim();

		if (!id) return fail(400, { error: 'アイテムが指定されていません。' });
		if (!/^\d+$/.test(raw)) return fail(400, { error: '在庫は 0 〜 9,999 の整数で入力してください。' });

		const target = Number(raw);
		// Same ceiling the item form enforces, so the two ways of setting stock
		// cannot disagree about what a valid quantity is.
		if (target > MAX_STOCK)
			return fail(400, { error: `在庫は ${MAX_STOCK.toLocaleString('ja-JP')} 以下で入力してください。` });

		const product = await getProductById(db, id);
		if (!product) return fail(404, { error: 'このアイテムは見つかりませんでした。' });

		const before = Number(product.stock ?? 0);
		if (target === before) return { message: `「${product.name}」の在庫は${before}のままです。` };

		// adjustStock takes a delta and re-reads the row under a compare-and-set,
		// so the delta is measured against the value in the database right now —
		// not against the value this browser happened to render with.
		const res = await adjustStock(db, id, target - before, ADJUST_REASON, 'admin');
		if (!res || !res.ok) {
			return fail(409, {
				error: `「${product.name}」の在庫を更新できませんでした。もう一度お試しください。`
			});
		}
		if (res.stock !== target) {
			// Someone moved the same stock mid-flight; report what it actually is.
			return {
				message: `「${product.name}」の在庫は${res.stock}になりました。別の変更と重なったため${target}にはなっていません。`
			};
		}
		return { message: `「${product.name}」の在庫を ${before} → ${res.stock} に更新しました。` };
	},

	// Copy a product as a draft and open the copy for editing.
	duplicate: async ({ request, platform }) => {
		const form = await request.formData();
		const id = String(form.get('id') ?? '');
		if (!id) return fail(400, { error: 'アイテムが指定されていません。' });

		const newId = await duplicateProduct(platform.env.DB, id);
		if (!newId) return fail(404, { error: 'このアイテムは見つかりませんでした。' });
		throw redirect(303, `/shop/edit/products/${newId}`);
	}
};
