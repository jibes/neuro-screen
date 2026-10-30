import type { TestSummary } from '$lib/db/models.js';
import { num, pct, t } from '$lib/i18n/index.js';

export interface SummaryEntry {
  label: string;
  value: string;
  /** Shown emphasised on the results card */
  highlight?: boolean;
}

export interface FormatContext {
  /** Completion time of Trail Making A in the same session, for B − A and B/A */
  trailAMs?: number | null;
}

const ms = (x: number) => `${num(x)} ms`;
const sec = (x: number, digits = 1) => `${num(x / 1000, digits)} s`;
const frac = (a: number, b: number) => `${a} / ${b}`;

/** All measures of a summary, labelled in the active locale (results card and detail page) */
export function summaryEntries(s: TestSummary, ctx: FormatContext = {}): SummaryEntry[] {
  const m = t().metrics;
  const out: SummaryEntry[] = [];
  const add = (label: string, value: string | number, highlight = false) =>
    out.push({ label, value: String(value), highlight });

  switch (s.type) {
    case 'go-nogo':
      add(m.accuracy, pct(s.accuracy, 1), true);
      add(m.dPrime, num(s.dPrime, 2), true);
      add(m.trialsGoNoGo, frac(s.goTrials, s.noGoTrials));
      add(m.hits, frac(s.hits, s.goTrials));
      add(m.omissions, s.omissionErrors);
      add(m.commissions, frac(s.commissionErrors, s.noGoTrials));
      add(m.rtHitsMeanSd, `${ms(s.meanRtHits)} ± ${num(s.sdRtHits)}`);
      add(m.rtHitsMedian, ms(s.medianRtHits));
      add(m.bias, num(s.responseBias, 2));
      add(m.excluded, frac(s.anticipations, s.rtOutliersExcluded));
      break;
    case 'flanker':
      add(m.flankerEffectMean, ms(s.flankerEffect), true);
      add(m.flankerEffectMedian, ms(s.flankerEffectMedian));
      add(m.accuracy, pct(s.accuracy, 1), true);
      add(m.rtCongruent, `${ms(s.meanRtCongruent)} / ${ms(s.medianRtCongruent)}`);
      add(m.rtIncongruent, `${ms(s.meanRtIncongruent)} / ${ms(s.medianRtIncongruent)}`);
      add(m.errorsCongruentIncongruent, frac(s.errorsCongruent, s.errorsIncongruent));
      add(m.misses, s.misses);
      add(m.excluded, frac(s.anticipations, s.rtOutliersExcluded));
      break;
    case 'stroop':
      add(m.stroopEffect, ms(s.stroopEffect), true);
      add(m.accuracy, pct(s.accuracy, 1), true);
      add(m.stroopInterference, ms(s.stroopInterference));
      add(m.stroopFacilitation, ms(s.stroopFacilitation));
      add(m.rtCongruent, `${ms(s.meanRtCongruent)} / ${ms(s.medianRtCongruent)}`);
      add(m.rtIncongruent, `${ms(s.meanRtIncongruent)} / ${ms(s.medianRtIncongruent)}`);
      add(m.rtNeutral, `${ms(s.meanRtNeutral)} / ${ms(s.medianRtNeutral)}`);
      add(m.errorsThree, `${s.errorsCongruent} / ${s.errorsIncongruent} / ${s.errorsNeutral}`);
      add(m.misses, s.misses);
      add(m.excluded, frac(s.anticipations, s.rtOutliersExcluded));
      break;
    case 'n-back':
      add(m.dPrime, num(s.dPrime, 2), true);
      add(m.accuracy, pct(s.accuracy, 1), true);
      add(m.level, `${s.nLevel}-Back`);
      add(m.hits, frac(s.hits, s.hits + s.misses));
      add(m.falseAlarms, s.falseAlarms);
      add(m.rtHitsMeanMedian, `${ms(s.meanRtHits)} / ${ms(s.medianRtHits)}`);
      break;
    case 'cpt':
      add(m.dPrime, num(s.dPrime, 2), true);
      add(m.hits, frac(s.hits, s.targetTrials));
      add(m.omissions, s.omissionErrors);
      add(m.commissions, s.commissionErrors);
      add(m.bias, num(s.responseBias, 2));
      add(m.rtHitsMeanSd, `${ms(s.meanRtHits)} ± ${num(s.sdRtHits)}`);
      add(m.cv, num(s.variabilityIndex, 3), true);
      add(m.rtByBlock, s.rtByBlock.map((r) => num(r)).join(' · ') + ' ms');
      add(m.omissionsByBlock, s.omissionsByBlock.join(' · '));
      add(m.commissionsByBlock, s.commissionsByBlock.join(' · '));
      add(m.excluded, frac(s.anticipations, s.rtOutliersExcluded));
      break;
    case 'digit-span':
      add(m.digitSpans, frac(s.forwardSpan, s.backwardSpan), true);
      add(m.rawForward, frac(s.forwardScore, s.forwardTotalTrials));
      add(m.rawBackward, frac(s.backwardScore, s.backwardTotalTrials));
      add(m.rawTotal, s.forwardScore + s.backwardScore, true);
      break;
    case 'corsi':
      add(m.corsiSpans, frac(s.forwardSpan, s.backwardSpan), true);
      add(m.corsiScores, frac(s.forwardScore, s.backwardScore));
      add(m.meanResponseTime, ms(s.meanResponseTime));
      break;
    case 'symbol-digit':
      add(m.correct, s.totalCorrect, true);
      add(m.attempted, s.totalAttempted);
      add(m.errors, s.totalErrors);
      add(m.timeLimit, `${s.timeLimit} s`);
      add(m.perSecond, num(s.throughput, 2), true);
      break;
    case 'trail-making':
      add(m.totalTime, sec(s.completionTimeMs), true);
      add(m.errors, s.errors);
      if (s.variant === 'B' && ctx.trailAMs) {
        add(m.bMinusA, sec(s.completionTimeMs - ctx.trailAMs), true);
        add(m.bOverA, num(s.completionTimeMs / ctx.trailAMs, 2));
      }
      add(m.variant, `Trail Making ${s.variant}`);
      add(m.segmentTimes, s.pathSegmentTimes.map((x) => num(x / 1000, 1)).join(' · ') + ' s');
      break;
    case 'wcst': {
      const share = (n: number) => (s.totalTrials ? n / s.totalTrials : 0);
      add(m.categories, s.categoriesCompleted, true);
      add(
        m.perseverativeErrors,
        `${s.perseverativeErrors} (${pct(share(s.perseverativeErrors), 1)})`,
        true,
      );
      add(m.trials, s.totalTrials);
      add(m.totalErrors, `${s.totalErrors} (${pct(share(s.totalErrors), 1)})`);
      add(m.perseverativeResponses, s.perseverativeResponses);
      add(m.nonPerseverativeErrors, s.nonPerseverativeErrors);
      add(
        m.conceptual,
        `${s.conceptualLevelResponses} (${pct(share(s.conceptualLevelResponses), 1)})`,
      );
      add(m.failureToMaintainSet, s.failureToMaintainSet);
      add(m.trialsToFirst, s.trialsToFirstCategory);
      break;
    }
    case 'tower':
      add(m.solvedOptimally, frac(s.problemsSolvedOptimally, s.totalProblems), true);
      add(m.solved, frac(s.problemsSolved, s.totalProblems));
      add(m.moves, frac(s.totalMoves, s.optimalMoves));
      add(m.excessMoves, s.excessMoves);
      add(m.planning, `${sec(s.meanPlanningTime)} / ${sec(s.meanPlanningTimeSolved)}`, true);
      add(m.execution, sec(s.meanExecutionTime));
      add(m.ruleViolations, s.ruleViolations);
      add(m.timeouts, s.timeouts);
      break;
    case 'word-list':
      add(m.sumA1A5, s.totalRecall, true);
      add(m.perTrial, s.wordsPerTrial.join(' – '));
      add(m.lot, s.learningOverTrials);
      add(m.slope, num(s.learningSlope, 2));
      add(m.listB, s.interferenceRecall);
      add(m.a6, s.shortDelayFreeRecall, true);
      add(m.pi, pct(s.proactiveInterference));
      add(m.ri, pct(s.retroactiveInterference));
      add(m.intrusions, s.intrusions);
      add(m.primacyRecency, `${pct(s.primacy)} / ${pct(s.recency)}`);
      add(m.presentation, t().common.presentation[s.presentationMode]);
      break;
    case 'delayed-recall':
      add(m.a7, frac(s.delayedRecall, s.totalItems), true);
      add(m.retention, pct(s.retentionRate), true);
      add(m.a5a6, frac(s.immediateRecall, s.shortDelayRecall));
      add(m.recognitionHits, frac(s.recognitionHits, s.totalItems));
      add(m.recognitionFp, `${s.recognitionFalseAlarms} (${s.recognitionListBErrors})`);
      add(m.discrimination, s.recognitionDiscriminability);
      add(m.recognitionDPrime, num(s.dPrimeRecognition, 2));
      add(m.intrusions, s.intrusionErrors);
      add(m.delay, `${s.delayMinutes} min`);
      break;
    case 'rey-figure':
      add(m.dPrimeImmediate, num(s.immediateDPrime, 2), true);
      add(
        m.hitsFpImmediate,
        `${s.immediateHits}/${s.immediateTargets} · ${s.immediateFalseAlarms}/${s.immediateDistractors}`,
      );
      add(m.dPrimeDelayed, num(s.delayedDPrime, 2), true);
      add(
        m.hitsFpDelayed,
        `${s.delayedHits}/${s.delayedTargets} · ${s.delayedFalseAlarms}/${s.delayedDistractors}`,
      );
      add(m.delay, `${num(s.delayMinutes, 1)} min`);
      break;
  }

  // Records saved by an older app version may lack fields of the current summary shape
  if (out.some((e) => e.value.includes('undefined') || e.value.includes('NaN'))) {
    throw new Error('legacy summary');
  }
  return out;
}

/** Raw key/value listing, used for summaries that cannot be formatted (older app versions) */
export function genericEntries(summary: unknown): SummaryEntry[] {
  return Object.entries(summary as Record<string, unknown>)
    .filter(([key]) => key !== 'type')
    .map(([key, value]) => ({
      label: key,
      value: typeof value === 'object' ? JSON.stringify(value) : String(value),
    }));
}

/** Formatted entries with a raw fallback for legacy records */
export function safeSummaryEntries(summary: TestSummary, ctx: FormatContext = {}): SummaryEntry[] {
  try {
    return summaryEntries(summary, ctx);
  } catch {
    return genericEntries(summary);
  }
}

/** One-line key result for the results overview */
export function keyMetric(s: TestSummary): string {
  const k = t().keyMetric;
  try {
    switch (s.type) {
      case 'go-nogo':
        return k.goNogo(num(s.dPrime, 2), pct(s.accuracy));
      case 'flanker':
        return k.flanker(num(s.flankerEffect), pct(s.accuracy));
      case 'stroop':
        return k.stroop(num(s.stroopEffect), pct(s.accuracy));
      case 'n-back':
        return k.nBack(num(s.dPrime, 2), pct(s.accuracy));
      case 'cpt':
        return k.cpt(num(s.dPrime, 2), num(s.meanRtHits));
      case 'digit-span':
        return k.digitSpan(s.forwardSpan, s.backwardSpan);
      case 'corsi':
        return k.corsi(s.forwardSpan, s.backwardSpan);
      case 'symbol-digit':
        return k.symbolDigit(s.totalCorrect, num(s.throughput, 2));
      case 'trail-making':
        return k.trail(s.variant, num(s.completionTimeMs / 1000, 1), s.errors);
      case 'wcst':
        return k.wcst(s.categoriesCompleted, s.perseverativeErrors);
      case 'tower':
        return k.tower(
          s.problemsSolvedOptimally,
          s.totalProblems,
          num(s.meanPlanningTime / 1000, 1),
        );
      case 'word-list':
        return k.wordList(s.totalRecall, s.shortDelayFreeRecall);
      case 'delayed-recall':
        return k.delayedRecall(
          s.delayedRecall,
          s.totalItems,
          pct(s.retentionRate),
          s.recognitionHits,
        );
      case 'rey-figure':
        return k.reyFigure(num(s.immediateDPrime, 2), num(s.delayedDPrime, 2));
    }
  } catch {
    // older summary shape
  }
  return '';
}
