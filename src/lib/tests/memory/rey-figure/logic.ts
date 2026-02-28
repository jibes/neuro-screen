import type { ReyElementResponse } from './types.js';
import type { ReyFigureSummary } from '$lib/db/models.js';
import { dPrime } from '$lib/utils/statistics.js';

export function computeSummary(
	copyResponses: ReyElementResponse[],
	copyTimeMs: number,
	recallResponses: ReyElementResponse[],
	recallTimeMs: number,
	delayMinutes: number
): ReyFigureSummary {
	const copyHits = copyResponses.filter((r) => r.isReal && r.userSaidYes).length;
	const copyCorrectRejections = copyResponses.filter((r) => !r.isReal && !r.userSaidYes).length;
	const copyScore = copyHits + copyCorrectRejections;

	const recallHits = recallResponses.filter((r) => r.isReal && r.userSaidYes).length;
	const recallCorrectRejections = recallResponses.filter((r) => !r.isReal && !r.userSaidYes).length;
	const recallScore = recallHits + recallCorrectRejections;

	return {
		type: 'rey-figure',
		copyScore,
		copyTimeMs,
		recallScore,
		recallTimeMs,
		delayMinutes,
		retentionRate: copyScore > 0 ? recallScore / copyScore : 0
	};
}
