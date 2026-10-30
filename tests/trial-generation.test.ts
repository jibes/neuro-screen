import { describe, expect, it } from 'vitest';
import { generateTrials as stroopTrials } from '$lib/tests/attention/stroop/logic.js';
import { STROOP_CONFIG } from '$lib/tests/attention/stroop/config.js';
import { generateTrials as flankerTrials } from '$lib/tests/executive/flanker/logic.js';
import { generateTrials as gngTrials } from '$lib/tests/attention/go-nogo/logic.js';
import { generateTrials as cptTrials } from '$lib/tests/attention/cpt/logic.js';
import { generateSequence } from '$lib/tests/working-memory/corsi/logic.js';

const maxRun = <T>(a: T[]) => {
  let max = 1;
  let run = 1;
  for (let i = 1; i < a.length; i++) {
    run = a[i] === a[i - 1] ? run + 1 : 1;
    max = Math.max(max, run);
  }
  return max;
};

describe('Stroop', () => {
  const runs = Array.from({ length: 20 }, () => stroopTrials(108, false).map((t) => t.stimulus));

  it('never repeats the ink colour on consecutive trials', () => {
    for (const st of runs) {
      expect(st.some((t, i) => i > 0 && t.inkColor === st[i - 1].inkColor)).toBe(false);
    }
  });

  it('never shows a word naming the previous ink', () => {
    for (const st of runs) {
      expect(st.some((t, i) => i > 0 && t.word === STROOP_CONFIG.words[st[i - 1].inkColor])).toBe(
        false,
      );
    }
  });

  it('limits runs of the same condition to 3', () => {
    for (const st of runs) expect(maxRun(st.map((t) => t.condition))).toBeLessThanOrEqual(3);
  });

  it('balances the 12 incongruent ink-word pairs (3 each)', () => {
    const pairs = new Map<string, number>();
    for (const t of runs[0].filter((t) => t.condition === 'incongruent')) {
      pairs.set(t.inkColor + t.word, (pairs.get(t.inkColor + t.word) ?? 0) + 1);
    }
    expect(pairs.size).toBe(12);
    expect([...pairs.values()].every((v) => v === 3)).toBe(true);
  });
});

describe('Flanker', () => {
  it('limits runs of condition and response to 3', () => {
    const fl = flankerTrials(80, 0.5, false).map((t) => t.stimulus);
    expect(maxRun(fl.map((t) => t.condition))).toBeLessThanOrEqual(3);
    expect(maxRun(fl.map((t) => t.targetDirection))).toBeLessThanOrEqual(3);
  });
});

describe('Go/No-Go', () => {
  const types = gngTrials(60, 0.75, false).map((t) => t.stimulus.type);

  it('has 25 % No-Go trials', () => {
    expect(types.filter((x) => x === 'nogo')).toHaveLength(15);
  });

  it('has at most 2 No-Go in a row', () => {
    expect(types.join(',')).not.toContain('nogo,nogo,nogo');
  });
});

describe('CPT', () => {
  it('has 10 targets in each of the 4 blocks', () => {
    const cp = cptTrials(200, 0.2, false).map((t) => t.stimulus);
    const perBlock = [0, 1, 2, 3].map((b) => cp.filter((t) => t.block === b && t.isTarget).length);
    expect(perBlock).toEqual([10, 10, 10, 10]);
  });
});

describe('Corsi', () => {
  it('never repeats a block within a sequence', () => {
    expect(new Set(generateSequence(9)).size).toBe(9);
  });
});
