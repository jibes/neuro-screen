import type { TrialConfig, TrialOutcome } from '$lib/core/trial-runner.svelte.js';
import type { ResponseEvent } from '$lib/core/response-collector.js';
import type { StroopTrial, StroopColor } from './types.js';
import type { StroopSummary } from '$lib/db/models.js';
import { STROOP_CONFIG } from './config.js';
import { constrainedShuffle, exceedsRun } from '$lib/utils/random.js';
import { mean, median, cleanRTs } from '$lib/utils/statistics.js';

const colorToWord: Record<StroopColor, string> = {
	rot: 'ROT',
	blau: 'BLAU',
	gruen: 'GRÜN',
	gelb: 'GELB'
};

const colorToKey: Record<StroopColor, string> = {
	rot: 'd',
	blau: 'f',
	gruen: 'j',
	gelb: 'k'
};

export function generateTrials(
	count: number,
	showFeedback: boolean
): TrialConfig<StroopTrial>[] {
	const perCondition = Math.round(count / 3);
	const trials: StroopTrial[] = [];
	const colors = STROOP_CONFIG.colors;

	for (let i = 0; i < perCondition; i++) {
		const color = colors[i % colors.length];
		trials.push({
			condition: 'congruent',
			word: colorToWord[color],
			inkColor: color,
			correctKey: colorToKey[color]
		});
	}

	for (let i = 0; i < perCondition; i++) {
		const inkColor = colors[i % colors.length];
		const otherColors = colors.filter((c) => c !== inkColor);
		const wordColor = otherColors[i % otherColors.length];
		trials.push({
			condition: 'incongruent',
			word: colorToWord[wordColor],
			inkColor: inkColor,
			correctKey: colorToKey[inkColor]
		});
	}

	const neutralCount = count - 2 * perCondition;
	for (let i = 0; i < neutralCount; i++) {
		const color = colors[i % colors.length];
		trials.push({
			condition: 'neutral',
			word: STROOP_CONFIG.neutralWord,
			inkColor: color,
			correctKey: colorToKey[color]
		});
	}

	// Counterbalancing constraints (MacLeod, 1991; Mayr et al., 2003):
	// - no ink-colour repetition on consecutive trials (avoids response-repetition priming)
	// - the word must not name the previous ink colour (avoids negative priming)
	// - max. 3 consecutive trials of the same condition
	const ordered = constrainedShuffle(trials, (seq, t) => {
		const prev = seq[seq.length - 1];
		if (prev) {
			if (prev.inkColor === t.inkColor) return false;
			if (t.word === colorToWord[prev.inkColor]) return false;
		}
		return !exceedsRun(seq, t, (x) => x.condition, 3);
	});

	return ordered.map((stimulus) => ({
		fixationDuration: STROOP_CONFIG.fixationDuration,
		stimulusDuration: STROOP_CONFIG.stimulusDuration,
		responseWindow: STROOP_CONFIG.responseWindow,
		feedbackDuration: STROOP_CONFIG.feedbackDuration,
		itiDuration: STROOP_CONFIG.itiDuration,
		stimulus,
		validKeys: [...STROOP_CONFIG.responseKeys],
		showFeedback
	}));
}

export function evaluateResponse(
	stimulus: StroopTrial,
	response: ResponseEvent | null
): { correct: boolean; customData: Record<string, unknown> } {
	if (!response) {
		return { correct: false, customData: { outcome: 'miss', condition: stimulus.condition } };
	}
	const correct = response.key === stimulus.correctKey;
	return {
		correct,
		customData: { outcome: correct ? 'correct' : 'error', condition: stimulus.condition }
	};
}

export function computeSummary(
	results: TrialOutcome[],
	trials: TrialConfig<StroopTrial>[]
): StroopSummary {
	const raw: Record<StroopTrial['condition'], number[]> = { congruent: [], incongruent: [], neutral: [] };
	const errors: Record<StroopTrial['condition'], number> = { congruent: 0, incongruent: 0, neutral: 0 };
	const counts: Record<StroopTrial['condition'], number> = { congruent: 0, incongruent: 0, neutral: 0 };
	let misses = 0;

	for (let i = 0; i < results.length; i++) {
		const condition = trials[i].stimulus.condition;
		const r = results[i];
		counts[condition]++;
		if (r.rt === null) misses++;
		if (r.correct && r.rt !== null) raw[condition].push(r.rt);
		if (!r.correct) errors[condition]++;
	}

	// RT statistics on correct trials, cleaned per condition
	const c = cleanRTs(raw.congruent);
	const ic = cleanRTs(raw.incongruent);
	const n = cleanRTs(raw.neutral);
	const meanCongruent = mean(c.kept);
	const meanIncongruent = mean(ic.kept);
	const meanNeutral = mean(n.kept);
	const totalCorrect = results.filter((r) => r.correct).length;

	return {
		type: 'stroop',
		congruentTrials: counts.congruent,
		incongruentTrials: counts.incongruent,
		neutralTrials: counts.neutral,
		meanRtCongruent: meanCongruent,
		meanRtIncongruent: meanIncongruent,
		meanRtNeutral: meanNeutral,
		stroopEffect: meanIncongruent - meanCongruent,
		stroopInterference: meanIncongruent - meanNeutral,
		stroopFacilitation: meanNeutral - meanCongruent,
		errorsCongruent: errors.congruent,
		errorsIncongruent: errors.incongruent,
		errorsNeutral: errors.neutral,
		medianRtCongruent: median(c.kept),
		medianRtIncongruent: median(ic.kept),
		medianRtNeutral: median(n.kept),
		misses,
		accuracy: results.length > 0 ? totalCorrect / results.length : 0,
		anticipations: c.anticipations + ic.anticipations + n.anticipations,
		rtOutliersExcluded: c.outliers + ic.outliers + n.outliers
	};
}
