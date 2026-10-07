import type { RecallResult } from './types.js';
import type { WordListSummary } from '$lib/db/models.js';

/** Uppercase and fold umlauts/ß so "Mütze", "MUETZE" and "muetze" match */
export function normalizeWord(word: string): string {
	return word
		.trim()
		.toUpperCase()
		.replace(/Ä/g, 'AE')
		.replace(/Ö/g, 'OE')
		.replace(/Ü/g, 'UE')
		.replace(/ẞ/g, 'SS');
}

export function scoreRecall(
	recalledWords: string[],
	targetWords: readonly string[]
): { correctCount: number; intrusionCount: number } {
	const targetSet = new Set(targetWords.map(normalizeWord));
	let correctCount = 0;
	let intrusionCount = 0;
	const counted = new Set<string>();

	for (const word of recalledWords) {
		const normalized = normalizeWord(word);
		if (!normalized) continue;
		if (counted.has(normalized)) continue;
		counted.add(normalized);

		if (targetSet.has(normalized)) {
			correctCount++;
		} else {
			intrusionCount++;
		}
	}

	return { correctCount, intrusionCount };
}

export function computeLearningSlope(wordsPerTrial: number[]): number {
	if (wordsPerTrial.length < 2) return 0;
	const n = wordsPerTrial.length;
	let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
	for (let i = 0; i < n; i++) {
		sumX += i + 1;
		sumY += wordsPerTrial[i];
		sumXY += (i + 1) * wordsPerTrial[i];
		sumX2 += (i + 1) * (i + 1);
	}
	return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
}

/** Proportion of the words at `positions` (0-based list indices) recalled across trials */
function serialPositionRate(trials: RecallResult[], targetWords: readonly string[], positions: number[]): number {
	if (trials.length === 0) return 0;
	const words = positions.map((p) => normalizeWord(targetWords[p]));
	let hits = 0;
	for (const t of trials) {
		const recalled = new Set(t.recalledWords.map(normalizeWord));
		hits += words.filter((w) => recalled.has(w)).length;
	}
	return hits / (words.length * trials.length);
}

/** RAVLT indices (Lezak et al., 2012; Schmidt, 1996) */
export function computeSummary(
	learningResults: RecallResult[],
	interferenceResult: RecallResult | null,
	shortDelayResult: RecallResult | null,
	targetWords: readonly string[],
	presentationMode: 'auditory' | 'visual'
): WordListSummary {
	const wordsPerTrial = learningResults.map((r) => r.correctCount);
	const a1 = wordsPerTrial[0] ?? 0;
	const a5 = wordsPerTrial[wordsPerTrial.length - 1] ?? 0;
	const totalRecall = wordsPerTrial.reduce((sum, n) => sum + n, 0);
	const b = interferenceResult?.correctCount ?? 0;
	const a6 = shortDelayResult?.correctCount ?? 0;
	const n = targetWords.length;
	const edge = Math.min(5, Math.floor(n / 3));

	return {
		type: 'word-list',
		learningTrials: learningResults.length,
		wordsPerTrial,
		totalLearned: a5,
		totalRecall,
		learningSlope: computeLearningSlope(wordsPerTrial),
		learningOverTrials: totalRecall - wordsPerTrial.length * a1,
		interferenceRecall: b,
		proactiveInterference: a1 > 0 ? b / a1 : 0,
		retroactiveInterference: a5 > 0 ? a6 / a5 : 0,
		shortDelayFreeRecall: a6,
		intrusions: [...learningResults, interferenceResult, shortDelayResult].reduce(
			(sum, r) => sum + (r?.intrusionCount ?? 0),
			0
		),
		primacy: serialPositionRate(learningResults, targetWords, Array.from({ length: edge }, (_, i) => i)),
		recency: serialPositionRate(learningResults, targetWords, Array.from({ length: edge }, (_, i) => n - edge + i)),
		presentationMode
	};
}
