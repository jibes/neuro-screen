# NeuroScreen

A browser-based neuropsychological screening platform. Runs 15 standardized cognitive tests across five domains, stores results locally in the browser, and exports trial-level data for analysis.

> **Disclaimer:** This tool is intended solely as a screening instrument and does not replace professional neuropsychological assessment.

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
| **Digit Span** | Verbal working memory capacity (forward recall) |
| **Corsi Block** | Visuospatial working memory span |
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
| **Word List** | Verbal learning across 5 acquisition trials |
| **Delayed Recall** | Long-term verbal memory retrieval |
| **Rey Figure** | Visual memory (immediate and delayed recognition of figure elements) |

---

## Features

- Frame-synchronised stimulus onsets and high-resolution response timestamps (`performance.now()` / `event.timeStamp`)
- Practice phases with feedback (accuracy threshold for the reaction-time tests, unscored practice for Digit Span)
- Automatic pause (with repetition of the interrupted trial) when the test window loses visibility
- Trial-by-trial data stored locally via IndexedDB (no server required)
- Export results as JSON (session) or CSV (trial level) for offline analysis
- Environment check to validate browser suitability before testing
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
