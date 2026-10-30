# neuro-screen: agent notes

Follows the portfolio standard: https://github.com/jibes/apps-data/blob/main/STANDARD.md
Deviations are listed below, each with a reason.

## Stack

- TypeScript strict, Svelte 5 + SvelteKit 2 (`adapter-static`), Tailwind CSS 4, Dexie, Vite 7,
  vite-plugin-pwa via `@vite-pwa/sveltekit`, Vitest, Playwright. Node: see `.nvmrc`.
- Check library APIs against the installed types in `node_modules`, not from memory.
- Use runes (`$state`, `$derived`, `$props`). Links and `goto` go through `resolve()` from `$app/paths`.

## Layout

- `src/lib/tests/<domain>/<test>/`: `config.ts`, `logic.ts` (pure, tested in `tests/`), `types.ts`
  and the component. `src/lib/core/`: timing, input, quality and environment checks.
  `src/lib/db/`: Dexie storage. `src/lib/results/`: summary formatting. `src/lib/i18n/`: catalogues.
- `src/routes/`: pages. `e2e/`: Playwright, served from `build/` by `e2e/serve.mjs`.
- `android/`: Capacitor shell (generated, then edited: version, signing, icons). `tools/android-*`:
  version scheme and emulator smoke test used by `.github/workflows/android.yml`.
- Keep each file under 800 lines; split before adding to it.

## Invariants

- Storage keys follow `neuroscreen.<name>.v<N>` (`theme`, `locale`, `disclaimerDismissed`).
  Never rename an existing key: bump the version and migrate. The IndexedDB name `NeuroScreen`
  predates the standard and stays; schema changes go through Dexie versions.
- User data never leaves the device. No network calls besides the own origin (CSP `connect-src 'self'`).
- No user-facing string is hard-coded. Add it to `src/lib/i18n/en.ts` (source) and `de.ts`
  (`satisfies Catalogue`); methods text to `methods.en.ts` / `methods.de.ts`. Stimulus material
  (word lists, Stroop words, speech language) is per locale, and every run stores its `locale`.
- Quality and environment notes are stored as `{ code, params }` and rendered at display time;
  plain strings from older runs must keep rendering.
- Scoring changes need a test in `tests/` and an update of the methods text.
- The pre-paint theme script in `src/app.html` duplicates `src/lib/theme.svelte.ts`; keep them in
  sync. Its CSP hash is computed in `svelte.config.js`, so keep it the only `<script>` in `app.html`.

## Android

- Same web sources, built as a pure SPA (`npm run build:native`, `NATIVE=1`): Capacitor serves
  `index.html` for every path, so nothing is prerendered and there is no CSP (the Capacitor
  bridge is injected as inline script). `npm run android:sync` builds and copies it into the shell;
  the copied assets are gitignored.
- Browser-only code (service worker, install prompt) checks `isNative` from `src/lib/native.ts`;
  native-only calls go into that module.
- `package.json` `version` is the app version. A push to main that touches the app releases the
  next free version (`tools/android-version.mjs`) when the `ANDROID_KEYSTORE_BASE64`,
  `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD` secrets and the
  `ANDROID_CERT_SHA256` variable are set; otherwise it builds a debug-signed APK only.
- Android System WebView often has no usable `speechSynthesis`: Digit Span and the word list fall back to
  visual presentation (stored with the run).

## Deviations from the standard

- **Svelte/SvelteKit + Tailwind instead of React + plain CSS:** existing app; a rewrite brings no benefit.
- **Dexie:** structured trial data with indices (allowed exception).
- **SvelteKit 2, Vite 7, vite-plugin-pwa 1.x, TypeScript 5.9 instead of current majors:**
  `@vite-pwa/sveltekit` supports only Kit 2 / vite-plugin-pwa 1.x, and `svelte-check` supports
  TS ≤ 6. Dependabot ignores these majors; lift once upstream catches up.
- **Absolute base path:** SvelteKit requires an absolute `paths.base`, so `VITE_BASE=./`
  (CI default) maps to the root.
- **`src/lib/` + `src/routes/` instead of `src/core/` + `src/ui/`:** SvelteKit convention.
- **German route names** (`/methodik`, `/ergebnisse`, `/umgebung`): existing URLs and bookmarks.
- **e2e serves `build/` with `e2e/serve.mjs` instead of `vite preview`:** Kit's preview does not
  serve the `404.html` fallback, which the service worker precaches.
- **Playwright** uses `/opt/pw-browsers/chromium` locally when present (cloud sessions); CI installs its own.

## Done checklist (before every push)

1. `npm run check` (typecheck, lint, format:check, unit)
2. `npm run build && npm run e2e`
3. If you fixed a bug, a test now covers it.
4. README is updated if you changed behaviour, scripts or services.
