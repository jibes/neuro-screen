# NeuroScreen

A browser-based neuropsychological screening platform. Runs 15 standardized cognitive tests across five domains, stores results locally in the browser, and exports trial-level data for analysis.

> **Disclaimer:** This tool is intended solely as a screening instrument and does not replace professional neuropsychological assessment.
>
> **Validation status:** all tests implement established paradigms, but these implementations are **not normed or validated**. Results are raw scores; see the in-app _Methodik_ page for procedures, deviations from the original instruments and references.

---

## Tests

### Attention & Inhibition

| Test                                  | What it measures                                      |
| ------------------------------------- | ----------------------------------------------------- |
| **Go/No-Go**                          | Response inhibition — react to green, withhold on red |
| **Flanker**                           | Selective attention and interference control          |
| **Stroop**                            | Color–word interference and cognitive control         |
| **CPT** (Continuous Performance Test) | Sustained attention over 200 trials                   |

### Working Memory

| Test            | What it measures                                                             |
| --------------- | ---------------------------------------------------------------------------- |
| **Digit Span**  | Verbal short-term / working memory (forward and backward, WAIS-IV procedure) |
| **Corsi Block** | Visuospatial span, forward and backward (Kessels et al., 2000 scoring)       |
| **N-Back**      | Working memory updating and monitoring                                       |

### Processing Speed

| Test               | What it measures                                            |
| ------------------ | ----------------------------------------------------------- |
| **Symbol Digit**   | Psychomotor speed (90-second substitution task)             |
| **Trail Making A** | Visual scanning and sequencing speed                        |
| **Trail Making B** | Cognitive flexibility (alternating number–letter sequences) |

### Executive Functions

| Test                                   | What it measures               |
| -------------------------------------- | ------------------------------ |
| **WCST** (Wisconsin Card Sorting Test) | Rule learning and set-shifting |
| **Tower of London**                    | Planning and problem-solving   |

### Memory

| Test               | What it measures                                                                        |
| ------------------ | --------------------------------------------------------------------------------------- |
| **Word List**      | Verbal learning, RAVLT procedure (A1–A5, list B, A6)                                    |
| **Delayed Recall** | Delayed recall (A7) and recognition with list-B and new foils                           |
| **Figure Memory**  | Visual recognition memory for figure elements (not the Rey-Osterrieth copy/recall test) |

---

## Features

- Frame-synchronised stimulus onsets and high-resolution response timestamps (`performance.now()` / `event.timeStamp`)
- Practice phases with feedback (accuracy threshold for the reaction-time tests, unscored practice for Digit Span)
- Automatic pause (with repetition of the interrupted trial) when the test window loses visibility
- Trial-by-trial data stored locally via IndexedDB (no server required)
- Export results as JSON (session) or CSV (trial level) for offline analysis
- RT cleaning (anticipations < 150 ms, ±2.5 SD trimming), counterbalanced trial sequences and data-quality flags
- In-app methods documentation with references
- Environment check to validate browser suitability before testing
- Installable as an app (PWA) and fully usable offline
- English and German UI and stimulus material (the language is stored with every run)

---

## Tech Stack

- [SvelteKit](https://kit.svelte.dev/) + [Svelte 5](https://svelte.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Dexie](https://dexie.org/) (IndexedDB wrapper)
- [Vite](https://vite.dev/), [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) (Workbox, prompt to update)
- [Vitest](https://vitest.dev/), [Playwright](https://playwright.dev/), ESLint, Prettier
- Deployed as a static site via `@sveltejs/adapter-static`

---

## Getting Started

Requires Node 22 (see `.nvmrc`).

```bash
npm ci
npm run dev     # development server
npm run check   # typecheck, lint, format check, unit tests
npm run build   # static site in build/
npm run e2e     # Playwright smoke tests (desktop + phone) against build/
```

Other scripts: `preview`, `typecheck`, `lint`, `format`, `format:check`, `test`, `test:coverage`.

---

## Deployment

Pushes to `main` run `.github/workflows/deploy.yml`: `configure-pages` provides the base path,
the CI workflow (all gates including e2e) runs against it, then `build/` is published to GitHub
Pages (one-time setup: _Settings → Pages → Source: GitHub Actions_). Pull requests run
`.github/workflows/ci.yml`. The base path comes from `VITE_BASE` (e.g. `/neuro-screen/`); local
builds use the root. Each build writes `version.json` (`{ build, time }`); a new version shows an
update banner instead of reloading mid-test.

---

## Android

The Android app wraps the same web build with [Capacitor](https://capacitorjs.com/)
(`android/`). `npm run apk` builds a debug APK locally (needs the Android SDK and JDK 21).
`.github/workflows/android.yml` builds, signs and smoke-tests it in an emulator on every pull
request and push to main, and publishes a GitHub release when the version in `package.json` has no
tag yet. Install and update with [Obtainium](https://obtainium.imranr.dev/) by adding
`https://github.com/jibes/neuro-screen`. The signing certificate SHA-256 is printed in each release.
Where the Android WebView offers no speech synthesis, spoken stimuli are shown visually.

---

## Privacy

Nothing leaves the device. Sessions, trial data and settings stay in the browser (IndexedDB
`NeuroScreen`, localStorage keys `neuroscreen.*.v1`). The app makes no network requests besides
loading its own files from the hosting origin, enforced by a Content Security Policy
(`connect-src 'self'`). Spoken stimuli use the browser's built-in speech synthesis; depending on
the operating system, that engine may itself use an online voice. JSON/CSV exports are created
only when you click export.

---

## License

[GPL-3.0-or-later](LICENSE)
