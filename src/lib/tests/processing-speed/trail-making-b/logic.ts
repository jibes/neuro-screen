import type { TrailMakingResult } from './types.js';
import type { TrailMakingSummary } from '$lib/db/models.js';
import { TRAIL_B_CONFIG } from './config.js';

export function getNodes() {
	return TRAIL_B_CONFIG.nodePositions;
}

/** Returns ordered array of node IDs representing the correct path: 1, A, 2, B, ... */
export function getExpectedSequence(): number[] {
	return Array.from({ length: TRAIL_B_CONFIG.nodeCount }, (_, i) => i);
}

export function computeSummary(result: TrailMakingResult): TrailMakingSummary {
	return {
		type: 'trail-making',
		variant: 'B',
		completionTimeMs: result.completionTimeMs,
		errors: result.errors,
		pathSegmentTimes: result.pathSegmentTimes
	};
}
