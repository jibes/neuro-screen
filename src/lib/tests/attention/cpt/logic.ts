import type { TrialConfig, TrialOutcome } from '$lib/core/trial-runner.svelte.js';
import type { ResponseEvent } from '$lib/core/response-collector.js';
import type { CPTTrial } from './types.js';
import type { CPTSummary } from '$lib/db/models.js';
import { CPT_CONFIG } from './config.js';
import { generateTrialSequence, pick } from '$lib/utils/random.js';
import { mean, sd, dPrime } from '$lib/utils/statistics.js';

export function generateTrials(
	count: number,
	targetRatio: number,
	showFeedback: boolean
): TrialConfig<CPTTrial>[] {
	const sequence = generateTrialSequence(count, targetRatio);
	const trialsPerBlock = CPT_CONFIG.trialsPerBlock;
	let lastLetter = '';

	return sequence.map((isTarget, idx) => {
		let letter: string;
		if (isTarget) {
			letter = CPT_CONFIG.targetLetter;
		} else {
			do {
				letter = pick(CPT_CONFIG.nonTargetLetters);
			} while (letter === lastLetter);
		}
		lastLetter = letter;

		const stimulus: CPTTrial = {
			letter,
			isTarget,
			block: Math.floor(idx / trialsPerBlock)
		};

		return {
			fixationDuration: CPT_CONFIG.fixationDuration,
			stimulusDuration: CPT_CONFIG.stimulusDuration,
			responseWindow: CPT_CONFIG.responseWindow,
			feedbackDuration: CPT_CONFIG.feedbackDuration,
			itiDuration: CPT_CONFIG.itiDuration,
			stimulus,
			validKeys: [CPT_CONFIG.responseKey],
			showFeedback
		};
	});
}

export function evaluateResponse(
	stimulus: CPTTrial,
	response: ResponseEvent | null
): { correct: boolean; customData: Record<string, unknown> } {
	const responded = response !== null;

	if (stimulus.isTarget) {
		return {
			correct: responded,
			customData: { outcome: responded ? 'hit' : 'omission', block: stimulus.block }
		};
	} else {
		return {
			correct: !responded,
			customData: { outcome: responded ? 'commission' : 'correctRejection', block: stimulus.block }
		};
	}
}

export function computeSummary(
	results: TrialOutcome[],
	trials: TrialConfig<CPTTrial>[]
): CPTSummary {
	let hits = 0;
	let commissionErrors = 0;
	let omissionErrors = 0;
	const hitRTs: number[] = [];
	const targetTrials = trials.filter((t) => t.stimulus.isTarget).length;
	const nonTargetTrials = trials.filter((t) => !t.stimulus.isTarget).length;

	const blockHitRTs: Map<number, number[]> = new Map();
	for (let b = 0; b < CPT_CONFIG.blocksCount; b++) {
		blockHitRTs.set(b, []);
	}

	for (let i = 0; i < results.length; i++) {
		const outcome = results[i].customData?.outcome;
		const block = trials[i].stimulus.block;

		switch (outcome) {
			case 'hit':
				hits++;
				if (results[i].rt !== null) {
					hitRTs.push(results[i].rt!);
					blockHitRTs.get(block)?.push(results[i].rt!);
				}
				break;
			case 'commission':
				commissionErrors++;
				break;
			case 'omission':
				omissionErrors++;
				break;
		}
	}

	const meanRT = mean(hitRTs);
	const sdRT = sd(hitRTs);

	const rtByBlock: number[] = [];
	for (let b = 0; b < CPT_CONFIG.blocksCount; b++) {
		rtByBlock.push(mean(blockHitRTs.get(b) ?? []));
	}

	return {
		type: 'cpt',
		totalTrials: results.length,
		targetTrials,
		hits,
		commissionErrors,
		omissionErrors,
		meanRtHits: meanRT,
		sdRtHits: sdRT,
		rtByBlock,
		dPrime: dPrime(hits, targetTrials, commissionErrors, nonTargetTrials),
		variabilityIndex: meanRT > 0 ? sdRT / meanRT : 0
	};
}
