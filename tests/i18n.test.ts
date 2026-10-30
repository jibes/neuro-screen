import { describe, expect, it } from 'vitest';
import { en } from '$lib/i18n/en.js';
import { de } from '$lib/i18n/de.js';
import { methodsEn } from '$lib/i18n/methods.en.js';
import { methodsDe } from '$lib/i18n/methods.de.js';
import { getLocale } from '$lib/i18n/index.js';
import { renderQualityFlag } from '$lib/core/quality.js';

/** Flatten a catalogue to dotted key paths with the value's kind */
function shape(obj: unknown, prefix = ''): string[] {
  if (Array.isArray(obj)) return [`${prefix}[]`];
  if (obj && typeof obj === 'object') {
    return Object.entries(obj).flatMap(([k, v]) => shape(v, prefix ? `${prefix}.${k}` : k));
  }
  return [`${prefix}:${typeof obj}`];
}

describe('catalogues', () => {
  it('de has exactly the keys of en', () => {
    expect(shape(de).sort()).toEqual(shape(en).sort());
  });

  it('methods de has exactly the keys of en', () => {
    expect(shape(methodsDe).sort()).toEqual(shape(methodsEn).sort());
  });

  it('word lists have 15 words each and no overlap', () => {
    for (const c of [en, de]) {
      const { wordListA: a, wordListB: b, wordListFoils: f } = c.stimuli;
      expect([a.length, b.length, f.length]).toEqual([15, 15, 15]);
      expect(new Set([...a, ...b, ...f]).size).toBe(45);
    }
  });

  it('defaults to English outside the browser', () => {
    expect(getLocale()).toBe('en');
  });
});

describe('stored flags', () => {
  it('renders structured flags at display time', () => {
    expect(renderQualityFlag({ code: 'anticipations', params: [3] })).toBe(
      'Anticipatory responses: 3',
    );
  });

  it('passes legacy string flags through', () => {
    expect(renderQualityFlag('Alter Hinweis')).toBe('Alter Hinweis');
  });
});
