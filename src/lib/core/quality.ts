import type { StoredFlag, TestSummary } from '$lib/db/models.js';
import { num, pct, t } from '$lib/i18n/index.js';

/**
 * Performance-validity / data-quality heuristics. A flag does not invalidate a result, but
 * signals that it should be interpreted with caution (e.g. chance-level responding,
 * many omissions, many anticipations, interruptions).
 * Flags are stored as codes with raw values and rendered in the active language.
 */
export function computeQualityFlags(
  summary: TestSummary,
  context: { pauses: number; touch: boolean },
): StoredFlag[] {
  const flags: StoredFlag[] = [];
  const flag = (code: QualityCode, ...params: number[]) => flags.push({ code, params });

  switch (summary.type) {
    case 'go-nogo':
      if (summary.goTrials > 0 && summary.omissionErrors / summary.goTrials > 0.3)
        flag('manyOmissions', summary.omissionErrors / summary.goTrials);
      if (summary.noGoTrials > 0 && summary.commissionErrors / summary.noGoTrials > 0.75)
        flag('respondsToNoGo');
      if (summary.anticipations > summary.goTrials * 0.1)
        flag('manyAnticipations', summary.anticipations);
      break;
    case 'flanker':
      // 2 response options: chance = 50 %
      if (summary.accuracy < 0.6) flag('nearChance2', summary.accuracy);
      if (summary.totalTrials > 0 && summary.misses / summary.totalTrials > 0.2)
        flag('manyMisses', summary.misses);
      if (summary.anticipations > 5) flag('anticipations', summary.anticipations);
      break;
    case 'stroop': {
      // 4 response options: chance = 25 %
      if (summary.accuracy < 0.5) flag('lowAccuracy4', summary.accuracy);
      const total = summary.congruentTrials + summary.incongruentTrials + summary.neutralTrials;
      if (total > 0 && summary.misses / total > 0.2) flag('manyMisses', summary.misses);
      if (summary.anticipations > 5) flag('anticipations', summary.anticipations);
      break;
    }
    case 'cpt':
      if (summary.targetTrials > 0 && summary.omissionErrors / summary.targetTrials > 0.5)
        flag('halfTargetsMissed', summary.omissionErrors);
      if (summary.dPrime < 0.5) flag('lowDPrime', summary.dPrime);
      break;
    case 'n-back':
      if (summary.dPrime < 0.5) flag('lowDPrime', summary.dPrime);
      if (summary.hits + summary.falseAlarms === 0) flag('noResponses');
      break;
    case 'digit-span':
    case 'corsi':
      if (summary.forwardSpan === 0) flag('spanZero');
      break;
    case 'symbol-digit':
      if (summary.totalAttempted > 0 && summary.totalErrors / summary.totalAttempted > 0.3)
        flag('highErrorRate', summary.totalErrors / summary.totalAttempted);
      break;
    case 'wcst':
      if (summary.categoriesCompleted === 0 && summary.totalTrials >= 64) flag('noCategory');
      break;
    case 'word-list':
      if (summary.wordsPerTrial.length > 0 && Math.max(...summary.wordsPerTrial) <= 2)
        flag('lowRecall');
      break;
    case 'delayed-recall':
      if (summary.delayMinutes < 20) flag('shortDelay', summary.delayMinutes);
      break;
    case 'rey-figure':
      if (summary.immediateDPrime < 0.5) flag('immediateNearChance', summary.immediateDPrime);
      break;
  }

  if (context.pauses > 0) flag('paused', context.pauses);
  if (context.touch) flag('touch');
  return flags;
}

export type QualityCode = keyof ReturnType<typeof t>['quality']['flags'];

/** Render a stored flag in the active language (plain strings come from older app versions) */
export function renderQualityFlag(flag: StoredFlag | string): string {
  if (typeof flag === 'string') return flag;
  const f = t().quality.flags;
  const a = Number(flag.params?.[0] ?? 0);
  switch (flag.code as QualityCode) {
    case 'manyOmissions':
      return f.manyOmissions(pct(a));
    case 'nearChance2':
      return f.nearChance2(pct(a));
    case 'lowAccuracy4':
      return f.lowAccuracy4(pct(a));
    case 'highErrorRate':
      return f.highErrorRate(pct(a));
    case 'lowDPrime':
      return f.lowDPrime(num(a, 2));
    case 'immediateNearChance':
      return f.immediateNearChance(num(a, 2));
    case 'manyAnticipations':
      return f.manyAnticipations(a);
    case 'anticipations':
      return f.anticipations(a);
    case 'manyMisses':
      return f.manyMisses(a);
    case 'halfTargetsMissed':
      return f.halfTargetsMissed(a);
    case 'shortDelay':
      return f.shortDelay(a);
    case 'paused':
      return f.paused(a);
    case 'respondsToNoGo':
      return f.respondsToNoGo;
    case 'noResponses':
      return f.noResponses;
    case 'spanZero':
      return f.spanZero;
    case 'noCategory':
      return f.noCategory;
    case 'lowRecall':
      return f.lowRecall;
    case 'touch':
      return f.touch;
    default:
      return flag.code;
  }
}
