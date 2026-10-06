// Single source of truth for admin wording.
//
// The client currently runs the shop on STORES, so the vocabulary here follows
// STORES' own screen labels (verified against their public help-centre
// articles) rather than inventing our own. Keeping one module means a wording
// change lands everywhere at once instead of drifting per screen.
//
// STORES terms adopted:
//   注文 -> オーダー / 商品 -> アイテム / 顧客 -> お客さま
//   SKU  -> 品番     / 発送済み -> 完了
//
// Order status vocabulary (STORES uses a single status, not Shopify's split
// payment/fulfilment axes — a single axis is the right size for a one-person
// shop and is what the client already reads fluently):
//   入金待ち -> 未発送 -> 完了 / キャンセル / 返金済み

/** Order status: key -> { label, tone, help } */
export const ORDER_STATUS = {
	pending_payment: {
		label: '入金待ち',
		tone: 'info',
		help: 'コンビニ決済・銀行振込で、お客さまのお支払い前です。入金が確認されると自動で「未発送」になります。'
	},
	paid: {
		label: '未発送',
		tone: 'warn',
		help: 'お支払い済みです。発送の対応をお願いします。'
	},
	shipped: {
		label: '完了',
		tone: 'good',
		help: '発送処理が完了しています。'
	},
	canceled: {
		label: 'キャンセル',
		tone: 'neutral',
		help: 'キャンセル済みのオーダーです。'
	},
	refunded: {
		label: '返金済み',
		tone: 'neutral',
		help: '返金を記録済みのオーダーです。'
	}
};

/** Tabs across the top of the order list, in STORES' reading order. */
export const ORDER_TABS = [
	{ key: 'paid', label: '未発送' },
	{ key: 'pending_payment', label: '入金待ち' },
	{ key: 'shipped', label: '完了' },
	{ key: 'canceled', label: 'キャンセル' },
	{ key: 'refunded', label: '返金済み' },
	{ key: 'all', label: 'すべて' }
];

/** Statuses that still need the owner to do something. */
export const OPEN_STATUSES = ['paid', 'pending_payment'];

export function orderStatusLabel(key) {
	return ORDER_STATUS[key]?.label ?? key;
}
export function orderStatusTone(key) {
	return ORDER_STATUS[key]?.tone ?? 'neutral';
}

/** Item (product) publication status. */
export const ITEM_STATUS = {
	published: { label: '公開', tone: 'good' },
	draft: { label: '下書き', tone: 'neutral' }
};

export function itemStatusLabel(key) {
	return ITEM_STATUS[key]?.label ?? key;
}

/** Field labels — STORES wording, used by the item form and CSV exports. */
export const FIELD = {
	sku: '品番',
	barcode: 'バーコード',
	cost: '原価',
	adminTags: '管理用タグ',
	itemName: 'アイテム名',
	itemDesc: 'アイテム説明',
	stock: '在庫',
	price: '価格'
};

/** Nouns used in headings and buttons. */
export const NOUN = {
	order: 'オーダー',
	orders: 'オーダー',
	item: 'アイテム',
	items: 'アイテム',
	customer: 'お客さま',
	customers: 'お客さま'
};

/** Stock adjustment reasons — mirrors STORES/Shopify vocabulary. */
export const STOCK_REASONS = [
	'入荷',
	'棚卸調整',
	'破損・廃棄',
	'返品戻し',
	'販売（自動）',
	'その他'
];

/**
 * STORES opens the order list pre-filtered to the last six months and offers a
 * [リセット] to clear it. We copy that so long-running shops stay fast and the
 * default view matches what the client is used to.
 */
export const DEFAULT_ORDER_MONTHS = 6;

/** STORES caps a bulk status change at 50 rows on desktop / 20 on mobile. */
export const BULK_LIMIT = 50;
