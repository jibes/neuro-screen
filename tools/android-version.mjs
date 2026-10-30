// Android app version for .github/workflows/android.yml (scheme: apps-data STANDARD.md §8).
// With --release (main): "version" in package.json is the minimum; the first free version from
// there is released, i.e. the next patch after the highest tag once it is taken. Raise minor/major
// in package.json. Without --release (PRs): last tag plus the number of commits since.
// Output: KEY=VALUE lines for $GITHUB_OUTPUT.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * versionCode = major·10⁷ + minor·10⁵ + patch·10³; the last three digits belong to dev builds
 * @param {string} v
 */
export function versionCode(v) {
  const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(v);
  if (!m) throw new Error(`Version "${v}" is not X.Y.Z`);
  const [major, minor, patch] = m.slice(1).map(Number);
  if (minor > 99 || patch > 99) throw new Error(`Version "${v}": minor and patch at most 99`);
  return major * 1e7 + minor * 1e5 + patch * 1e3;
}

/**
 * Next version after the highest tag, at least `min`; patch overflows into minor at 99
 * @param {string} min
 * @param {string[]} tags
 */
export function nextRelease(min, tags) {
  const top = tags
    .filter((t) => /^\d+\.\d+\.\d+$/.test(t))
    .sort((a, b) => versionCode(a) - versionCode(b))
    .pop();
  if (!top || versionCode(min) > versionCode(top)) return min;
  let [major, minor, patch] = top.split('.').map(Number);
  if (++patch > 99) {
    patch = 0;
    if (++minor > 99) {
      minor = 0;
      major++;
    }
  }
  return `${major}.${minor}.${patch}`;
}

/**
 * @param {string} lastTagVersion empty without a tag
 * @param {number} commitsSince
 */
export function devCode(lastTagVersion, commitsSince) {
  return (lastTagVersion ? versionCode(lastTagVersion) : 0) + Math.min(commitsSince, 999);
}

function main() {
  /** @param {string[]} args */
  const git = (...args) =>
    execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  /** @param {string[]} args */
  const tryGit = (...args) => {
    try {
      return git(...args);
    } catch {
      return '';
    }
  };
  const min = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version;
  versionCode(min); // validates the format
  const release = process.argv.includes('--release');
  const tags = tryGit('tag', '--list', 'v*')
    .split('\n')
    .filter(Boolean)
    .map((t) => t.slice(1));
  const version = release ? nextRelease(min, tags) : min;

  const out = { version, tag: `v${version}`, release };
  if (release) {
    Object.assign(out, { code: versionCode(version), name: version });
  } else {
    const last = tryGit('describe', '--tags', '--match', 'v[0-9]*', '--abbrev=0');
    const n = Number(git('rev-list', '--count', last ? `${last}..HEAD` : 'HEAD'));
    const sha = git('rev-parse', '--short', 'HEAD');
    const base = last ? last.slice(1) : '0.0.0';
    Object.assign(out, { code: devCode(last && base, n), name: `${base}-dev.${n}+${sha}` });
  }
  for (const [k, v] of Object.entries(out)) console.log(`${k}=${v}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
