# NeuroScreen

A browser-based neuropsychological screening platform. Runs 15 standardized cognitive tests across five domains, stores results locally in the browser, and exports trial-level data for analysis.

> **Disclaimer:** This tool is intended solely as a screening instrument and does not replace professional neuropsychological assessment.
>
> **Validation status:** all tests implement established paradigms, but these implementations are **not normed or validated**. Results are raw scores; see the in-app *Methodik* page for procedures, deviations from the original instruments and references.

---

## Tests

### Attention & Inhibition
| Test | What it measures |
|------|-----------------|
| **Go/No-Go** | Response inhibition — react to green, withhold on red |
| **Flanker** | Selective attention and interference control |
| **Stroop** | Color–word interference and cognitive control |
| **CPT** (Continuous Performance Test) | Sustained attention over 200 trials |

### Working Memory
| Test | What it measures |
|------|-----------------|
| **Digit Span** | Verbal short-term / working memory (forward and backward, WAIS-IV procedure) |
| **Corsi Block** | Visuospatial span, forward and backward (Kessels et al., 2000 scoring) |
| **N-Back** | Working memory updating and monitoring |

### Processing Speed
| Test | What it measures |
|------|-----------------|
| **Symbol Digit** | Psychomotor speed (90-second substitution task) |
| **Trail Making A** | Visual scanning and sequencing speed |
| **Trail Making B** | Cognitive flexibility (alternating number–letter sequences) |

### Executive Functions
| Test | What it measures |
|------|-----------------|
| **WCST** (Wisconsin Card Sorting Test) | Rule learning and set-shifting |
| **Tower of London** | Planning and problem-solving |

### Memory
| Test | What it measures |
|------|-----------------|
| **Word List** | Verbal learning, RAVLT procedure (A1–A5, list B, A6) |
| **Delayed Recall** | Delayed recall (A7) and recognition with list-B and new foils |
| **Figure Memory** | Visual recognition memory for figure elements (not the Rey-Osterrieth copy/recall test) |

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
- Fully localized in German

---

## Tech Stack

- [SvelteKit](https://kit.svelte.dev/) + [Svelte 5](https://svelte.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Dexie](https://dexie.org/) (IndexedDB wrapper)
- [Vite](https://vite.dev/)
- Deployed as a static site via `@sveltejs/adapter-static`

---

## Getting Started

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Type-check
pnpm check

# Build for production
pnpm build
```

---

## Deployment

Pushes to `main` are built and published to GitHub Pages by `.github/workflows/deploy.yml`
(one-time setup: *Settings → Pages → Source: GitHub Actions*). The build sets
`BASE_PATH=/<repo-name>` so all links resolve under the Pages subpath; local builds use the root path.

---

## License

[MIT](LICENSE)
