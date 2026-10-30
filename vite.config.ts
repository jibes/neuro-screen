import { execSync } from 'node:child_process';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { defineConfig, type Plugin } from 'vite';

function gitSha(): string {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    return 'dev';
  }
}

const build = { build: gitSha(), time: new Date().toISOString() };

/** Absolute app base for the service worker URL and scope (Kit sets Vite's base to './') */
const rawBase = process.env.VITE_BASE ?? '/';
const appBase = rawBase === './' ? '/' : rawBase.replace(/\/?$/, '/');

/** Writes version.json ({ build, time }) next to the app, read by the update prompt and Settings */
const versionJson: Plugin = {
  name: 'version-json',
  apply: 'build',
  generateBundle() {
    if (this.environment?.name !== 'client' && this.environment) return;
    this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify(build) });
  },
};

export default defineConfig({
  define: { __BUILD__: JSON.stringify(build) },
  worker: { format: 'es' },
  plugins: [
    tailwindcss(),
    sveltekit(),
    versionJson,
    SvelteKitPWA({
      registerType: 'prompt',
      base: appBase,
      scope: appBase,
      // registerSW() in UpdateBanner drives the update prompt
      injectRegister: false,
      // static/manifest.webmanifest is linked from app.html
      manifest: false,
      kit: { base: appBase, adapterFallback: '404.html', spa: true, includeVersionFile: true },
      workbox: {
        clientsClaim: true,
        // Navigations are served by the precached SPA fallback (404.html); ssr is off, so it
        // renders every route offline
        globPatterns: ['client/**/*.{js,css,svg,png,webmanifest,json}'],
      },
    }),
  ],
});
