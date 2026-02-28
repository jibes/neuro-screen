import type { TrialConfig, TrialOutcome } from '$lib/core/trial-runner.svelte.js';
import type { ResponseEvent } from '$lib/core/response-collector.js';
import type { StroopTrial, StroopColor } from './types.js';
import type { StroopSummary } from '$lib/db/models.js';
import { STROOP_CONFIG } from './config.js';
import { shuffle } from '$lib/utils/random.js';
import { mean } from '$lib/utils/statistics.js';

const colorToWord: Record<StroopColor, string> = {
	rot: 'ROT',
	blau: 'BLAU',
	gruen: 'GRUEN',
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

	shuffle(trials);

	return trials.map((stimulus) => ({
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
	const congruentRTs: number[] = [];
	const incongruentRTs: number[] = [];
	const neutralRTs: number[] = [];
	let errorsCongruent = 0;
	let errorsIncongruent = 0;
	let errorsNeutral = 0;
	let congruentTrials = 0;
	let incongruentTrials = 0;
	let neutralTrials = 0;

	for (let i = 0; i < results.length; i++) {
		const condition = trials[i].stimulus.condition;
		const r = results[i];

		if (condition === 'congruent') {
			congruentTrials++;
			if (r.correct && r.rt !== null) congruentRTs.push(r.rt);
			if (!r.correct) errorsCongruent++;
		} else if (condition === 'incongruent') {
			incongruentTrials++;
			if (r.correct && r.rt !== null) incongruentRTs.push(r.rt);
			if (!r.correct) errorsIncongruent++;
		} else {
			neutralTrials++;
			if (r.correct && r.rt !== null) neutralRTs.push(r.rt);
			if (!r.correct) errorsNeutral++;
		}
	}

	const meanCongruent = mean(congruentRTs);
	const meanIncongruent = mean(incongruentRTs);
	const meanNeutral = mean(neutralRTs);
	const totalCorrect = results.filter((r) => r.correct).length;

	return {
		type: 'stroop',
		congruentTrials,
		incongruentTrials,
		neutralTrials,
		meanRtCongruent: meanCongruent,
		meanRtIncongruent: meanIncongruent,
		meanRtNeutral: meanNeutral,
		stroopEffect: meanIncongruent - meanCongruent,
		stroopInterference: meanIncongruent - meanNeutral,
		stroopFacilitation: meanNeutral - meanCongruent,
		errorsCongruent,
		errorsIncongruent,
		errorsNeutral,
		accuracy: results.length > 0 ? totalCorrect / results.length : 0
	};
}
