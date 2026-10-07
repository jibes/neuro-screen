/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

/**
 * Offline support: precaches the app shell, all prerendered pages and static files.
 * The cache is versioned per build; old caches are removed on activation.
 */
import { base, build, files, prerendered, version } from '$service-worker';

const sw = self as unknown as ServiceWorkerGlobalScope;
const CACHE = `neuroscreen-${version}`;
// Client-side routes without a prerendered page (e.g. /ergebnisse/123) are served by the SPA fallback
const FALLBACK = `${base}/404.html`;
const ASSETS = [...build, ...files, ...prerendered, FALLBACK];

sw.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(CACHE)
			.then((cache) => cache.addAll(ASSETS))
			.then(() => sw.skipWaiting())
	);
});

sw.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
			.then(() => sw.clients.claim())
	);
});

sw.addEventListener('fetch', (event) => {
	const { request } = event;
	if (request.method !== 'GET') return;
	const url = new URL(request.url);
	if (url.origin !== sw.location.origin) return;

	event.respondWith(
		(async () => {
			const cache = await caches.open(CACHE);

			// Build output and static files never change within a version: cache first
			if (ASSETS.includes(url.pathname)) {
				const cached = await cache.match(url.pathname);
				if (cached) return cached;
			}

			// Everything else: network first, fall back to cache / SPA shell when offline
			try {
				const response = await fetch(request);
				if (response.ok && response.type === 'basic' && !url.pathname.startsWith(`${base}/_app/`)) {
					cache.put(request, response.clone());
				}
				return response;
			} catch (err) {
				const cached = await cache.match(request, { ignoreSearch: true });
				if (cached) return cached;
				if (request.mode === 'navigate') {
					const shell =
						(await cache.match(url.pathname.replace(/\/$/, '') + '.html')) ??
						(await cache.match(url.pathname)) ??
						(await cache.match(FALLBACK));
					if (shell) return shell;
				}
				throw err;
			}
		})()
	);
});
