import { describe, expect, it } from 'vitest';
import { devCode, nextRelease, versionCode } from '../tools/android-version.mjs';

describe('Android version', () => {
  it('computes the standard versionCode', () => {
    expect(versionCode('1.2.3')).toBe(10_203_000);
    expect(() => versionCode('1.2')).toThrow();
    expect(() => versionCode('1.100.0')).toThrow();
  });

  it('releases package.json version first, then the next free patch', () => {
    expect(nextRelease('1.0.0', [])).toBe('1.0.0');
    expect(nextRelease('1.0.0', ['1.0.0'])).toBe('1.0.1');
    expect(nextRelease('1.1.0', ['1.0.4'])).toBe('1.1.0');
    expect(nextRelease('1.0.0', ['1.0.99'])).toBe('1.1.0');
  });

  it('keeps dev builds above the last tag and below the next release', () => {
    expect(devCode('1.0.0', 5)).toBe(10_000_005);
    expect(devCode('', 3)).toBe(3);
    expect(devCode('1.0.0', 5000)).toBeLessThan(versionCode('1.0.1'));
  });
});
