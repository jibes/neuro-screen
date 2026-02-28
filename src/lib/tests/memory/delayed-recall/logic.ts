import type { DelayedRecallSummary } from '$lib/db/models.js';
import { scoreRecall } from '../word-list/logic.js';

export function computeSummary(
	recalledWords: string[],
	targetWords: readonly string[],
	immediateRecall: number,
	delayMinutes: number
): DelayedRecallSummary {
	const { correctCount, intrusionCount } = scoreRecall(recalledWords, targetWords);

	return {
		type: 'delayed-recall',
		immediateRecall,
		delayedRecall: correctCount,
		retentionRate: immediateRecall > 0 ? correctCount / immediateRecall : 0,
		delayMinutes,
		totalItems: targetWords.length,
		intrusionErrors: intrusionCount
	};
}
