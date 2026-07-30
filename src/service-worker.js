/// <reference types="@sveltejs/kit" />
import { build, files, version } from '$service-worker';

// Cache strategy:
// - hashed build assets + light static files: precache, cache-first
// - /media/* (R2 uploads, immutable keys) and /images/*: runtime cache-first
// - navigations: network-first with cache fallback (offline shell)
// - /log/api/*: never cached (always network)
const CACHE = `sui-log-${version}`;

// Skip the heavy photo library and OGP image from the precache; they are
// runtime-cached on first view instead.
const PRECACHE = [
	...new Set([...build, ...files.filter((f) => !f.startsWith('/images/') && f !== '/ogp.png')])
];

self.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(CACHE)
			.then((cache) => cache.addAll(PRECACHE))
			.then(() => self.skipWaiting())
	);
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
			.then(() => self.clients.claim())
	);
});

self.addEventListener('fetch', (event) => {
	const { request } = event;
	if (request.method !== 'GET') return;

	const url = new URL(request.url);
	if (url.origin !== location.origin) return;
	// APIs are always live — payment and admin data must never come from cache
	if (url.pathname.startsWith('/log/api/') || url.pathname.startsWith('/shop/api/')) return;

	if (PRECACHE.includes(url.pathname)) {
		event.respondWith(cacheFirst(request));
		return;
	}
	if (url.pathname.startsWith('/media/') || url.pathname.startsWith('/images/')) {
		event.respondWith(cacheFirst(request));
		return;
	}
	if (request.mode === 'navigate') {
		event.respondWith(networkFirst(request));
	}
});

async function cacheFirst(request) {
	const cache = await caches.open(CACHE);
	const hit = await cache.match(request);
	if (hit) return hit;
	const res = await fetch(request);
	if (res.ok) cache.put(request, res.clone());
	return res;
}

async function networkFirst(request) {
	const cache = await caches.open(CACHE);
	try {
		const res = await fetch(request);
		if (res.ok) cache.put(request, res.clone());
		return res;
	} catch {
		const hit = await cache.match(request);
		if (hit) return hit;
		return new Response('offline', { status: 503, headers: { 'content-type': 'text/plain' } });
	}
}
