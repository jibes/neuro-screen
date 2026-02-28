import type { TrialConfig, TrialOutcome } from '$lib/core/trial-runner.svelte.js';
import type { ResponseEvent } from '$lib/core/response-collector.js';
import type { NBackTrial } from './types.js';
import type { NBackSummary } from '$lib/db/models.js';
import { NBACK_CONFIG } from './config.js';
import { pick } from '$lib/utils/random.js';
import { mean, dPrime } from '$lib/utils/statistics.js';

export function generateNBackSequence(
	count: number,
	nLevel: number,
	targetRatio: number,
	letters: string[]
): NBackTrial[] {
	const trials: NBackTrial[] = [];
	const targetCount = Math.round((count - nLevel) * targetRatio);

	const availablePositions: number[] = [];
	for (let i = nLevel; i < count; i++) {
		availablePositions.push(i);
	}

	const shuffled = [...availablePositions].sort(() => Math.random() - 0.5);
	const targetPositions = new Set(shuffled.slice(0, targetCount));

	for (let i = 0; i < nLevel; i++) {
		trials.push({
			letter: pick(letters),
			isTarget: false,
			position: i,
			nLevel
		});
	}

	for (let i = nLevel; i < count; i++) {
		const isTarget = targetPositions.has(i);
		let letter: string;

		if (isTarget) {
			letter = trials[i - nLevel].letter;
		} else {
			const nBackLetter = trials[i - nLevel].letter;
			do {
				letter = pick(letters);
			} while (letter === nBackLetter);
		}

		trials.push({ letter, isTarget, position: i, nLevel });
	}

	return trials;
}

export function generateTrials(
	count: number,
	nLevel: number,
	targetRatio: number,
	showFeedback: boolean
): TrialConfig<NBackTrial>[] {
	const sequence = generateNBackSequence(count, nLevel, targetRatio, [...NBACK_CONFIG.letters]);

	return sequence.map((stimulus) => ({
		fixationDuration: NBACK_CONFIG.fixationDuration,
		stimulusDuration: NBACK_CONFIG.stimulusDuration,
		responseWindow: NBACK_CONFIG.responseWindow,
		feedbackDuration: NBACK_CONFIG.feedbackDuration,
		itiDuration: NBACK_CONFIG.itiDuration,
		stimulus,
		validKeys: [NBACK_CONFIG.responseKey],
		showFeedback
	}));
}

export function evaluateResponse(
	stimulus: NBackTrial,
	response: ResponseEvent | null
): { correct: boolean; customData: Record<string, unknown> } {
	const responded = response !== null;

	if (stimulus.isTarget) {
		return {
			correct: responded,
			customData: { outcome: responded ? 'hit' : 'miss' }
		};
	} else {
		return {
			correct: !responded,
			customData: { outcome: responded ? 'falseAlarm' : 'correctRejection' }
		};
	}
}

export function computeSummary(
	results: TrialOutcome[],
	trials: TrialConfig<NBackTrial>[]
): NBackSummary {
	let hits = 0;
	let falseAlarms = 0;
	let misses = 0;
	let correctRejections = 0;
	const hitRTs: number[] = [];

	const targetTrials = trials.filter((t) => t.stimulus.isTarget).length;
	const nonTargetTrials = trials.filter((t) => !t.stimulus.isTarget).length;

	for (let i = 0; i < results.length; i++) {
		const outcome = results[i].customData?.outcome;
		switch (outcome) {
			case 'hit':
				hits++;
				if (results[i].rt !== null) hitRTs.push(results[i].rt!);
				break;
			case 'falseAlarm':
				falseAlarms++;
				break;
			case 'miss':
				misses++;
				break;
			case 'correctRejection':
				correctRejections++;
				break;
		}
	}

	const totalCorrect = hits + correctRejections;

	return {
		type: 'n-back',
		nLevel: trials[0]?.stimulus.nLevel ?? NBACK_CONFIG.nLevel,
		totalTrials: results.length,
		hits,
		falseAlarms,
		misses,
		correctRejections,
		meanRtHits: mean(hitRTs),
		dPrime: dPrime(hits, targetTrials, falseAlarms, nonTargetTrials),
		accuracy: results.length > 0 ? totalCorrect / results.length : 0
	};
}
