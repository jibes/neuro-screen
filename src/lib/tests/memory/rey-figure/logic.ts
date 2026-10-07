import type { ReyElement, ReyElementResponse } from './types.js';
import type { ReyFigureSummary } from '$lib/db/models.js';
import { dPrime } from '$lib/utils/statistics.js';
import { shuffled } from '$lib/utils/random.js';
import { REY_ELEMENTS, REY_FIGURE_CONFIG } from './config.js';

/**
 * Split real elements and distractors into two disjoint, shuffled item sets so that the
 * delayed phase is not contaminated by re-exposure to the immediate-phase items.
 */
export function createPhaseItemSets(): { immediate: ReyElement[]; delayed: ReyElement[] } {
	const real = shuffled(REY_ELEMENTS.filter((e) => e.isReal));
	const distractors = shuffled(REY_ELEMENTS.filter((e) => !e.isReal));
	const r = REY_FIGURE_CONFIG.realPerPhase;
	const d = REY_FIGURE_CONFIG.distractorsPerPhase;
	return {
		immediate: shuffled([...real.slice(0, r), ...distractors.slice(0, d)]),
		delayed: shuffled([...real.slice(r, 2 * r), ...distractors.slice(d, 2 * d)])
	};
}

function scorePhase(responses: ReyElementResponse[]) {
	const targets = responses.filter((r) => r.isReal).length;
	const distractors = responses.length - targets;
	const hits = responses.filter((r) => r.isReal && r.userSaidYes).length;
	const falseAlarms = responses.filter((r) => !r.isReal && r.userSaidYes).length;
	return {
		hits,
		falseAlarms,
		targets,
		distractors,
		// Signal detection: a yes-bias no longer inflates the score
		dPrime: targets > 0 && distractors > 0 ? dPrime(hits, targets, falseAlarms, distractors) : 0
	};
}

export function computeSummary(
	immediateResponses: ReyElementResponse[],
	immediateTimeMs: number,
	delayedResponses: ReyElementResponse[],
	delayedTimeMs: number,
	delayMinutes: number
): ReyFigureSummary {
	const imm = scorePhase(immediateResponses);
	const del = scorePhase(delayedResponses);

	return {
		type: 'rey-figure',
		immediateHits: imm.hits,
		immediateFalseAlarms: imm.falseAlarms,
		immediateTargets: imm.targets,
		immediateDistractors: imm.distractors,
		immediateDPrime: imm.dPrime,
		immediateTimeMs,
		delayedHits: del.hits,
		delayedFalseAlarms: del.falseAlarms,
		delayedTargets: del.targets,
		delayedDistractors: del.distractors,
		delayedDPrime: del.dPrime,
		delayedTimeMs,
		delayMinutes
	};
}
