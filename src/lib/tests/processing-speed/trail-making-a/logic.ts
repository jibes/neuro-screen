import type { TrailMakingResult } from './types.js';
import type { TrailMakingSummary } from '$lib/db/models.js';
import { TRAIL_A_CONFIG } from './config.js';

export function getNodes() {
	return TRAIL_A_CONFIG.nodePositions;
}

export function getExpectedSequence(): number[] {
	return Array.from({ length: TRAIL_A_CONFIG.nodeCount }, (_, i) => i + 1);
}

export function computeSummary(result: TrailMakingResult): TrailMakingSummary {
	return {
		type: 'trail-making',
		variant: 'A',
		completionTimeMs: result.completionTimeMs,
		errors: result.errors,
		pathSegmentTimes: result.pathSegmentTimes
	};
}
