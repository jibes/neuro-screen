import type { TrialConfig, TrialOutcome } from '$lib/core/trial-runner.svelte.js';
import type { ResponseEvent } from '$lib/core/response-collector.js';
import type { FlankerTrial, FlankerCondition, FlankerDirection } from './types.js';
import type { FlankerSummary } from '$lib/db/models.js';
import { FLANKER_CONFIG } from './config.js';
import { shuffle } from '$lib/utils/random.js';
import { mean, sd } from '$lib/utils/statistics.js';

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

	shuffle(trials);

	return trials.map((stimulus) => ({
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
		return { correct: false, customData: { outcome: 'miss' } };
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
	const congruentRTs: number[] = [];
	const incongruentRTs: number[] = [];
	let errorsCongruent = 0;
	let errorsIncongruent = 0;
	let congruentTrials = 0;
	let incongruentTrials = 0;

	for (let i = 0; i < results.length; i++) {
		const condition = trials[i].stimulus.condition;
		if (condition === 'congruent') {
			congruentTrials++;
			if (results[i].correct && results[i].rt !== null) {
				congruentRTs.push(results[i].rt!);
			}
			if (!results[i].correct) errorsCongruent++;
		} else {
			incongruentTrials++;
			if (results[i].correct && results[i].rt !== null) {
				incongruentRTs.push(results[i].rt!);
			}
			if (!results[i].correct) errorsIncongruent++;
		}
	}

	const meanCongruent = mean(congruentRTs);
	const meanIncongruent = mean(incongruentRTs);
	const totalCorrect = results.filter((r) => r.correct).length;

	return {
		type: 'flanker',
		totalTrials: results.length,
		congruentTrials,
		incongruentTrials,
		meanRtCongruent: meanCongruent,
		meanRtIncongruent: meanIncongruent,
		flankerEffect: meanIncongruent - meanCongruent,
		errorsCongruent,
		errorsIncongruent,
		accuracy: results.length > 0 ? totalCorrect / results.length : 0
	};
}
