import type { TrialConfig, TrialOutcome } from '$lib/core/trial-runner.svelte.js';
import type { ResponseEvent } from '$lib/core/response-collector.js';
import type { FlankerTrial, FlankerCondition, FlankerDirection } from './types.js';
import type { FlankerSummary } from '$lib/db/models.js';
import { FLANKER_CONFIG } from './config.js';
import { constrainedShuffle, exceedsRun } from '$lib/utils/random.js';
import { mean, median, cleanRTs } from '$lib/utils/statistics.js';

function createFlankerDisplay(condition: FlankerCondition, target: FlankerDirection): string {
	const targetArrow = target === 'left' ? '<' : '>';
	const flankerArrow = condition === 'congruent' ? targetArrow : (target === 'left' ? '>' : '<');
	return `${flankerArrow}${flankerArrow}${targetArrow}${flankerArrow}${flankerArrow}`;
}

export function generateTrials(
	count: number,
	congruentRatio: number,
	showFeedback: boolean
): TrialConfig<FlankerTrial>[] {
	const congruentCount = Math.round(count * congruentRatio);
	const incongruentCount = count - congruentCount;

	const trials: FlankerTrial[] = [];

	// Congruent: half left, half right
	for (let i = 0; i < congruentCount; i++) {
		const dir: FlankerDirection = i < congruentCount / 2 ? 'left' : 'right';
		trials.push({
			condition: 'congruent',
			targetDirection: dir,
			display: createFlankerDisplay('congruent', dir)
		});
	}

	// Incongruent: half left, half right
	for (let i = 0; i < incongruentCount; i++) {
		const dir: FlankerDirection = i < incongruentCount / 2 ? 'left' : 'right';
		trials.push({
			condition: 'incongruent',
			targetDirection: dir,
			display: createFlankerDisplay('incongruent', dir)
		});
	}

	// Max. 3 consecutive trials of the same condition or the same correct response
	const ordered = constrainedShuffle(
		trials,
		(seq, t) =>
			!exceedsRun(seq, t, (x) => x.condition, 3) && !exceedsRun(seq, t, (x) => x.targetDirection, 3)
	);

	return ordered.map((stimulus) => ({
		fixationDuration: FLANKER_CONFIG.fixationDuration,
		stimulusDuration: FLANKER_CONFIG.stimulusDuration,
		responseWindow: FLANKER_CONFIG.responseWindow,
		feedbackDuration: FLANKER_CONFIG.feedbackDuration,
		itiDuration: FLANKER_CONFIG.itiDuration,
		stimulus,
		validKeys: [...FLANKER_CONFIG.responseKeys],
		showFeedback
	}));
}

export function evaluateResponse(
	stimulus: FlankerTrial,
	response: ResponseEvent | null
): { correct: boolean; customData: Record<string, unknown> } {
	if (!response) {
		return { correct: false, customData: { outcome: 'miss', condition: stimulus.condition } };
	}

	const expectedKey = stimulus.targetDirection === 'left'
		? FLANKER_CONFIG.leftKey
		: FLANKER_CONFIG.rightKey;

	const correct = response.key === expectedKey;
	return {
		correct,
		customData: {
			outcome: correct ? 'correct' : 'error',
			condition: stimulus.condition
		}
	};
}

export function computeSummary(
	results: TrialOutcome[],
	trials: TrialConfig<FlankerTrial>[]
): FlankerSummary {
	const rawCongruent: number[] = [];
	const rawIncongruent: number[] = [];
	let errorsCongruent = 0;
	let errorsIncongruent = 0;
	let congruentTrials = 0;
	let incongruentTrials = 0;
	let misses = 0;

	for (let i = 0; i < results.length; i++) {
		const r = results[i];
		const congruent = trials[i].stimulus.condition === 'congruent';
		if (congruent) congruentTrials++;
		else incongruentTrials++;
		if (r.rt === null) misses++;
		if (r.correct && r.rt !== null) {
			(congruent ? rawCongruent : rawIncongruent).push(r.rt);
		}
		if (!r.correct) {
			if (congruent) errorsCongruent++;
			else errorsIncongruent++;
		}
	}

	// RT statistics on correct trials, cleaned per condition
	const c = cleanRTs(rawCongruent);
	const ic = cleanRTs(rawIncongruent);
	const meanCongruent = mean(c.kept);
	const meanIncongruent = mean(ic.kept);
	const medianCongruent = median(c.kept);
	const medianIncongruent = median(ic.kept);
	const totalCorrect = results.filter((r) => r.correct).length;

	return {
		type: 'flanker',
		totalTrials: results.length,
		congruentTrials,
		incongruentTrials,
		meanRtCongruent: meanCongruent,
		meanRtIncongruent: meanIncongruent,
		flankerEffect: meanIncongruent - meanCongruent,
		medianRtCongruent: medianCongruent,
		medianRtIncongruent: medianIncongruent,
		flankerEffectMedian: medianIncongruent - medianCongruent,
		errorsCongruent,
		errorsIncongruent,
		misses,
		accuracy: results.length > 0 ? totalCorrect / results.length : 0,
		anticipations: c.anticipations + ic.anticipations,
		rtOutliersExcluded: c.outliers + ic.outliers
	};
}
