import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			// GitHub Pages serves 404.html for unknown paths, so dynamic routes
			// (e.g. /ergebnisse/[testId]) fall back to the client-side app
			fallback: '404.html'
		}),
		paths: {
			// Set to "/<repo>" when building for GitHub Pages; empty for local dev/preview
			base: process.env.BASE_PATH ?? ''
		}
	}
};

export default config;
