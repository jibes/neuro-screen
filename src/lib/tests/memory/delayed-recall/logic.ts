import type { DelayedRecallSummary } from '$lib/db/models.js';
import { scoreRecall, normalizeWord } from '../word-list/logic.js';
import { dPrime } from '$lib/utils/statistics.js';

export interface RecognitionResponse {
	word: string;
	kind: 'target' | 'listB' | 'foil';
	saidYes: boolean;
	rt: number;
}

export function computeSummary(
	recalledWords: string[],
	targetWords: readonly string[],
	immediateRecall: number,
	shortDelayRecall: number,
	delayMinutes: number,
	recognition: RecognitionResponse[]
): DelayedRecallSummary {
	const { correctCount, intrusionCount } = scoreRecall(recalledWords, targetWords);
	const targets = recognition.filter((r) => r.kind === 'target');
	const nonTargets = recognition.filter((r) => r.kind !== 'target');
	const hits = targets.filter((r) => r.saidYes).length;
	const falseAlarms = nonTargets.filter((r) => r.saidYes).length;

	return {
		type: 'delayed-recall',
		immediateRecall,
		shortDelayRecall,
		delayedRecall: correctCount,
		retentionRate: immediateRecall > 0 ? correctCount / immediateRecall : 0,
		delayMinutes,
		totalItems: targetWords.length,
		intrusionErrors: intrusionCount,
		recognitionHits: hits,
		recognitionFalseAlarms: falseAlarms,
		recognitionListBErrors: recognition.filter((r) => r.kind === 'listB' && r.saidYes).length,
		recognitionDiscriminability: hits - falseAlarms,
		dPrimeRecognition: targets.length > 0 && nonTargets.length > 0 ? dPrime(hits, targets.length, falseAlarms, nonTargets.length) : 0
	};
}

export { normalizeWord };
