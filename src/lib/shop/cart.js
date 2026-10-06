// Client-side cart: [{ id, qty }] persisted to localStorage. Product data
// (name/price/stock) is always re-fetched from the server — the cart never
// stores prices, so the server stays the single source of truth.
import { writable } from 'svelte/store';

const KEY = 'sui_cart_v1';
const MAX_QTY = 9;

function load() {
	if (typeof localStorage === 'undefined') return [];
	try {
		const raw = JSON.parse(localStorage.getItem(KEY) ?? '[]');
		return Array.isArray(raw) ? raw.filter((i) => i?.id && i?.qty > 0) : [];
	} catch {
		return [];
	}
}

export const cart = writable(load());
export const cartOpen = writable(false);
/** Set by CartDrawer while it is on the page. The site chrome uses it to decide
 *  whether the cart control can open the drawer or has to send the reader to
 *  the shop first. */
export const cartDrawerMounted = writable(false);

cart.subscribe((items) => {
	if (typeof localStorage !== 'undefined') {
		localStorage.setItem(KEY, JSON.stringify(items));
	}
});

export function addToCart(id, qty = 1) {
	cart.update((items) => {
		const hit = items.find((i) => i.id === id);
		if (hit) {
			hit.qty = Math.min(MAX_QTY, hit.qty + qty);
			return [...items];
		}
		return [...items, { id, qty: Math.min(MAX_QTY, qty) }];
	});
	cartOpen.set(true);
}

export function setQty(id, qty) {
	cart.update((items) =>
		qty <= 0
			? items.filter((i) => i.id !== id)
			: items.map((i) => (i.id === id ? { ...i, qty: Math.min(MAX_QTY, qty) } : i))
	);
}

export function clearCart() {
	cart.set([]);
}
