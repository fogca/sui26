// Parse + validate the product form (shared by create/edit actions).
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
// path segments under /shop/ that products must not shadow
const RESERVED = ['edit', 'api', 'new', 'thanks', 'legal', 'mock-checkout'];

export function parseProductForm(form) {
	const values = {
		name: String(form.get('name') ?? '').trim(),
		slug: String(form.get('slug') ?? '').trim(),
		spec: String(form.get('spec') ?? '').trim(),
		price: parseInt(String(form.get('price') ?? ''), 10),
		stock: parseInt(String(form.get('stock') ?? ''), 10),
		status: String(form.get('status') ?? 'draft'),
		description: String(form.get('description') ?? '')
	};
	let images = [];
	try {
		const parsed = JSON.parse(String(form.get('images') ?? '[]'));
		if (Array.isArray(parsed)) images = parsed.filter((s) => typeof s === 'string');
	} catch {
		// ignore, treated as empty
	}
	values.images = images;

	if (!values.name) return { error: '商品名を入力してください', values };
	if (!SLUG_RE.test(values.slug)) return { error: 'slug は半角英数字とハイフンのみ', values };
	if (RESERVED.includes(values.slug)) return { error: 'その slug は予約されています', values };
	if (!Number.isFinite(values.price) || values.price < 0) return { error: '価格が不正です', values };
	if (!Number.isFinite(values.stock) || values.stock < 0) return { error: '在庫数が不正です', values };
	if (!['draft', 'published'].includes(values.status)) return { error: '公開状態が不正です', values };

	return { error: null, values };
}
