import { t } from '$lib/i18n/index.js';

const i = t();

export const WORD_LIST_CONFIG = {
  testId: 'word-list',
  testName: i.tests.wordList.name,
  instructions: i.tests.wordList.instructions,

  learningTrials: 5,
  wordDisplayDurationMs: 1500,
  interWordIntervalMs: 500,
  recallTimeLimitMs: 60000, // per free-recall phase

  /** Word lists in the active language; the lists used are saved with each run */
  targetWords: i.stimuli.wordListA,
  /** List B (interference list) – also used as foils in the delayed recognition trial */
  interferenceWords: i.stimuli.wordListB,
  /** Semantic/phonemic foils for recognition (delayed-recall test) */
  distractorWords: i.stimuli.wordListFoils,
} as const;
