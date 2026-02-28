import type { TrialConfig } from '$lib/core/trial-runner.svelte.js';
import type { ResponseEvent } from '$lib/core/response-collector.js';
import type { GoNoGoTrial, StimulusType } from './types.js';
import type { GoNoGoSummary } from '$lib/db/models.js';
import { GO_NOGO_CONFIG } from './config.js';
import { generateTrialSequence } from '$lib/utils/random.js';
import { mean, median, sd, dPrime, responseBias } from '$lib/utils/statistics.js';
import type { TrialOutcome } from '$lib/core/trial-runner.svelte.js';

export function generateTrials(
	count: number,
	goRatio: number,
	showFeedback: boolean
): TrialConfig<GoNoGoTrial>[] {
	const sequence = generateTrialSequence(count, goRatio);

	return sequence.map((isGo) => {
		const type: StimulusType = isGo ? 'go' : 'nogo';
		return {
			fixationDuration: GO_NOGO_CONFIG.fixationDuration,
			stimulusDuration: GO_NOGO_CONFIG.stimulusDuration,
			responseWindow: GO_NOGO_CONFIG.responseWindow,
			feedbackDuration: GO_NOGO_CONFIG.feedbackDuration,
			itiDuration: GO_NOGO_CONFIG.itiDuration,
			stimulus: {
				type,
				color: type === 'go' ? GO_NOGO_CONFIG.goColor : GO_NOGO_CONFIG.noGoColor
			},
			validKeys: [GO_NOGO_CONFIG.responseKey],
			showFeedback
		};
	});
}

export function evaluateResponse(
	stimulus: GoNoGoTrial,
	response: ResponseEvent | null
): { correct: boolean; customData: Record<string, unknown> } {
	const responded = response !== null;

	if (stimulus.type === 'go') {
		return {
			correct: responded,
			customData: {
				outcome: responded ? 'hit' : 'omission'
			}
		};
	} else {
		return {
			correct: !responded,
			customData: {
				outcome: responded ? 'commission' : 'correctRejection'
			}
		};
	}
}

export function computeSummary(
	results: TrialOutcome[],
	trials: TrialConfig<GoNoGoTrial>[]
): GoNoGoSummary {
	let hits = 0;
	let correctRejections = 0;
	let commissionErrors = 0;
	let omissionErrors = 0;
	const hitRTs: number[] = [];

	const goTrials = trials.filter((t) => t.stimulus.type === 'go').length;
	const noGoTrials = trials.filter((t) => t.stimulus.type === 'nogo').length;

	for (let i = 0; i < results.length; i++) {
		const outcome = results[i].customData?.outcome;
		switch (outcome) {
			case 'hit':
				hits++;
				if (results[i].rt !== null) hitRTs.push(results[i].rt!);
				break;
			case 'correctRejection':
				correctRejections++;
				break;
			case 'commission':
				commissionErrors++;
				break;
			case 'omission':
				omissionErrors++;
				break;
		}
	}

	const totalCorrect = hits + correctRejections;

	return {
		type: 'go-nogo',
		totalTrials: results.length,
		goTrials,
		noGoTrials,
		hits,
		correctRejections,
		commissionErrors,
		omissionErrors,
		meanRtHits: mean(hitRTs),
		sdRtHits: sd(hitRTs),
		medianRtHits: median(hitRTs),
		accuracy: results.length > 0 ? totalCorrect / results.length : 0,
		dPrime: dPrime(hits, goTrials, commissionErrors, noGoTrials),
		responseBias: responseBias(hits, goTrials, commissionErrors, noGoTrials)
	};
}
