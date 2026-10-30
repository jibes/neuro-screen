import { resolve } from '$app/paths';
import type { Pathname } from '$app/types';
import { t } from '$lib/i18n/index.js';

const i = t();

export interface TestInfo {
  id: string;
  name: string;
  shortDesc: string;
  /** Route path without base (pass to resolve() for goto) */
  path: Pathname;
  /** Resolved href including base */
  href: string;
  /** Approximate duration in minutes, including instructions and practice */
  minutes: number;
  /** Shown on the card, e.g. a prerequisite */
  note?: string;
}

export interface TestCategory {
  name: string;
  tests: TestInfo[];
}

/** Catalogue keys of the tests (excludes shared sections such as `trail`) */
type TestKey = Exclude<keyof typeof i.tests, 'trail'>;

function info(id: string, key: TestKey, minutes: number, note?: string): TestInfo {
  return {
    id,
    name: i.tests[key].name,
    shortDesc: i.tests[key].shortDesc,
    path: `/tests/${id}` as Pathname,
    href: resolve(`/tests/${id}` as Pathname),
    minutes,
    note,
  };
}

/** All tests, grouped by domain, in recommended order */
export const TEST_CATEGORIES: TestCategory[] = [
  {
    name: i.categories.attention,
    tests: [
      info('go-nogo', 'goNogo', 4),
      info('flanker', 'flanker', 5),
      info('stroop', 'stroop', 6),
      info('cpt', 'cpt', 8),
    ],
  },
  {
    name: i.categories.workingMemory,
    tests: [
      info('n-back', 'nBack', 4),
      info('digit-span', 'digitSpan', 5),
      info('corsi', 'corsi', 5),
    ],
  },
  {
    name: i.categories.processingSpeed,
    tests: [
      info('symbol-digit', 'symbolDigit', 2),
      info('trail-making-a', 'trailMakingA', 2),
      info('trail-making-b', 'trailMakingB', 3),
    ],
  },
  {
    name: i.categories.executive,
    tests: [info('wcst', 'wcst', 8), info('tower', 'tower', 6)],
  },
  {
    name: i.categories.memory,
    tests: [
      info('word-list', 'wordList', 12),
      info('delayed-recall', 'delayedRecall', 2, i.home.delayedNote),
      info('rey-figure', 'reyFigure', 5),
    ],
  },
];

export const ALL_TESTS: TestInfo[] = TEST_CATEGORIES.flatMap((c) => c.tests);

export function getTestName(testId: string): string {
  return ALL_TESTS.find((t) => t.id === testId)?.name ?? testId;
}

/** The test following `testId` in recommended order, or null for the last one */
export function getNextTest(testId: string): TestInfo | null {
  const idx = ALL_TESTS.findIndex((t) => t.id === testId);
  return idx >= 0 && idx < ALL_TESTS.length - 1 ? ALL_TESTS[idx + 1] : null;
}
