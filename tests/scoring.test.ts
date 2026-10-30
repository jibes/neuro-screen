import { describe, expect, it } from 'vitest';
import {
  computeSummary as wcstSummary,
  generateDeck,
  getMatchedDimensions,
  isCorrectMatch,
} from '$lib/tests/executive/wcst/logic.js';
import { WCST_CONFIG } from '$lib/tests/executive/wcst/config.js';
import type { WCSTRule, WCSTTrialResult } from '$lib/tests/executive/wcst/types.js';
import { cleanRTs } from '$lib/utils/statistics.js';
import { computeSummary as wlSummary, scoreRecall } from '$lib/tests/memory/word-list/logic.js';
import type { RecallResult } from '$lib/tests/memory/word-list/types.js';
import {
  checkResponse as dsCheck,
  computeSummary as dsSummary,
} from '$lib/tests/working-memory/digit-span/logic.js';
import { computeSummary as corsiSummary } from '$lib/tests/working-memory/corsi/logic.js';

describe('WCST', () => {
  const deck = generateDeck();

  it('uses a deterministic 128-card deck', () => {
    expect(deck).toHaveLength(128);
    expect(generateDeck()).toEqual(deck);
    expect(new Set(deck.slice(0, 64).map((c) => c.color + c.shape + c.count)).size).toBe(64);
  });

  /** Simulate a participant; `choose` returns the rule the participant sorts by */
  function simulate(choose: (rule: WCSTRule) => WCSTRule, maxTrials: number) {
    const rules = WCST_CONFIG.ruleSequence;
    let ruleIdx = 0;
    let streak = 0;
    const results: WCSTTrialResult[] = [];
    for (let t = 0; t < maxTrials && ruleIdx < 6; t++) {
      const card = deck[t];
      const rule = rules[ruleIdx % 3];
      const ref = WCST_CONFIG.referenceCards.findIndex((_, i) =>
        isCorrectMatch(card, i, choose(rule)),
      );
      const correct = isCorrectMatch(card, ref, rule);
      results.push({
        testCard: card,
        selectedRefIndex: ref,
        currentRule: rule,
        matchedDimensions: getMatchedDimensions(card, WCST_CONFIG.referenceCards[ref]),
        correct,
        isPerseverative: false,
        trialNumber: t,
        rt: 1,
      } as WCSTTrialResult);
      streak = correct ? streak + 1 : 0;
      if (streak >= 10) {
        ruleIdx++;
        streak = 0;
      }
    }
    return wcstSummary(results);
  }

  it('scores a perfect sorter: 6 categories, no errors, 60 trials', () => {
    const s = simulate((rule) => rule, 128);
    expect(s.categoriesCompleted).toBe(6);
    expect(s.totalErrors).toBe(0);
    expect(s.perseverativeErrors).toBe(0);
    expect(s.totalTrials).toBe(60);
  });

  it('scores every error of a colour perseverator as perseverative', () => {
    const s = simulate(() => 'color', 40);
    expect(s.categoriesCompleted).toBe(1);
    expect(s.totalErrors).toBeGreaterThan(0);
    expect(s.perseverativeErrors).toBe(s.totalErrors);
  });
});

describe('cleanRTs', () => {
  it('removes anticipations, then SD outliers', () => {
    const c = cleanRTs([100, 120, 400, 410, 420, 430, 440, 450, 460, 470, 480, 490, 3000]);
    expect(c.anticipations).toBe(2);
    expect(c.outliers).toBe(1);
    expect(c.kept).toHaveLength(10);
  });
});

describe('Word list (RAVLT)', () => {
  const A = 'ABCDEFGHIJKLMNO'.split('').map((ch) => `A${ch}`);
  const B = ['B1', 'B2', 'B3', 'B4'];
  const rec = (words: string[], target: string[], phase: string): RecallResult =>
    ({
      phase,
      trialNumber: 0,
      recalledWords: words,
      ...scoreRecall(words, target),
      responseTimeMs: 1,
    }) as RecallResult;

  const s = wlSummary(
    [5, 7, 9, 11]
      .map((n) => rec(A.slice(0, n), A, 'learning'))
      .concat(rec([...A.slice(0, 12), 'X'], A, 'learning')),
    rec(B.slice(0, 3), B, 'interference'),
    rec(A.slice(0, 9), A, 'shortDelay'),
    A,
    'visual',
  );

  it('computes sum, learning over trials and intrusions', () => {
    expect(s.totalRecall).toBe(44);
    expect(s.learningOverTrials).toBe(19);
    expect(s.intrusions).toBe(1);
  });

  it('scores interference against list B', () => {
    expect(s.proactiveInterference).toBeCloseTo(0.6);
    expect(s.retroactiveInterference).toBeCloseTo(0.75);
    expect(s.primacy).toBe(1);
  });

  it('folds umlauts when scoring', () => {
    expect(scoreRecall(['Mütze'], ['MUETZE']).correctCount).toBe(1);
  });
});

describe('Digit span', () => {
  it('checks backward responses in reverse order', () => {
    expect(
      dsCheck(
        { digits: [1, 2, 3], spanLength: 3, attemptNumber: 1, direction: 'backward' },
        [3, 2, 1],
      ),
    ).toBe(true);
  });

  it('computes span and raw score per direction', () => {
    const r = (len: number, direction: 'forward' | 'backward', correct: boolean) => ({
      trial: { digits: [], spanLength: len, attemptNumber: 1, direction },
      userResponse: [],
      correct,
      responseTimeMs: 1,
    });
    const s = dsSummary([
      r(2, 'forward', true),
      r(3, 'forward', true),
      r(2, 'backward', true),
      r(3, 'backward', false),
    ]);
    expect([s.forwardSpan, s.backwardSpan, s.forwardScore, s.backwardScore]).toEqual([3, 2, 2, 1]);
  });
});

describe('Corsi', () => {
  it('computes the Kessels total score (span × correct)', () => {
    const r = (len: number) => ({
      trial: { sequence: [], spanLength: len, attemptNumber: 1, direction: 'forward' as const },
      userResponse: [],
      correct: true,
      responseTimeMs: 5,
    });
    const s = corsiSummary([r(2), r(3)]);
    expect(s.forwardSpan).toBe(3);
    expect(s.forwardScore).toBe(6);
  });
});
