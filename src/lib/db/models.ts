import type { EnvironmentInfo } from '../core/environment-check.js';

export interface Session {
	id?: number;
	startedAt: string;
	participantCode?: string;
	environment: EnvironmentInfo;
	completedTests: string[];
}

export interface TestRun {
	id?: number;
	sessionId: number;
	testId: string;
	startedAt: string;
	completedAt: string;
	durationMs: number;
	config: Record<string, unknown>;
	summary: TestSummary;
	environmentWarnings: string[];
	/** Data-quality warnings (e.g. near-chance accuracy, many omissions) */
	qualityFlags?: string[];
}

export interface TrialData {
	id?: number;
	testRunId: number;
	trialNumber: number;
	phase: string;
	stimulus: Record<string, unknown>;
	response: Record<string, unknown>;
	rt: number | null;
	correct: boolean | null;
	onsetTimestamp: number;
	responseTimestamp: number | null;
	customData: Record<string, unknown>;
}

// --- Test Summary Types ---

export type TestSummary =
	| GoNoGoSummary
	| FlankerSummary
	| DigitSpanSummary
	| StroopSummary
	| NBackSummary
	| CPTSummary
	| CorsiSummary
	| SymbolDigitSummary
	| TrailMakingSummary
	| WCSTSummary
	| TowerSummary
	| WordListSummary
	| DelayedRecallSummary
	| ReyFigureSummary;

export interface GoNoGoSummary {
	type: 'go-nogo';
	totalTrials: number;
	goTrials: number;
	noGoTrials: number;
	hits: number;
	correctRejections: number;
	commissionErrors: number;
	omissionErrors: number;
	meanRtHits: number;
	sdRtHits: number;
	medianRtHits: number;
	accuracy: number;
	dPrime: number;
	responseBias: number;
	/** Go responses faster than 150 ms (excluded from RT statistics) */
	anticipations: number;
	/** Hit RTs beyond ±2.5 SD (excluded from RT statistics) */
	rtOutliersExcluded: number;
}

export interface FlankerSummary {
	type: 'flanker';
	totalTrials: number;
	congruentTrials: number;
	incongruentTrials: number;
	meanRtCongruent: number;
	meanRtIncongruent: number;
	flankerEffect: number;
	medianRtCongruent: number;
	medianRtIncongruent: number;
	/** Median-based flanker effect (robust to skew) */
	flankerEffectMedian: number;
	errorsCongruent: number;
	errorsIncongruent: number;
	misses: number;
	accuracy: number;
	anticipations: number;
	rtOutliersExcluded: number;
}

export interface DigitSpanSummary {
	type: 'digit-span';
	direction: 'forward' | 'backward' | 'both';
	forwardSpan: number;
	backwardSpan: number;
	forwardTrialsCorrect: number;
	backwardTrialsCorrect: number;
	forwardTotalTrials: number;
	backwardTotalTrials: number;
	forwardScore: number;
	backwardScore: number;
}

export interface StroopSummary {
	type: 'stroop';
	congruentTrials: number;
	incongruentTrials: number;
	neutralTrials: number;
	meanRtCongruent: number;
	meanRtIncongruent: number;
	meanRtNeutral: number;
	stroopEffect: number;
	stroopInterference: number;
	stroopFacilitation: number;
	errorsCongruent: number;
	errorsIncongruent: number;
	errorsNeutral: number;
	medianRtCongruent: number;
	medianRtIncongruent: number;
	medianRtNeutral: number;
	misses: number;
	accuracy: number;
	anticipations: number;
	rtOutliersExcluded: number;
}

export interface NBackSummary {
	type: 'n-back';
	nLevel: number;
	totalTrials: number;
	hits: number;
	falseAlarms: number;
	misses: number;
	correctRejections: number;
	meanRtHits: number;
	medianRtHits: number;
	dPrime: number;
	accuracy: number;
	anticipations: number;
}

export interface CPTSummary {
	type: 'cpt';
	totalTrials: number;
	targetTrials: number;
	hits: number;
	commissionErrors: number;
	omissionErrors: number;
	meanRtHits: number;
	sdRtHits: number;
	rtByBlock: number[];
	omissionsByBlock: number[];
	commissionsByBlock: number[];
	dPrime: number;
	responseBias: number;
	variabilityIndex: number;
	anticipations: number;
	rtOutliersExcluded: number;
}

export interface CorsiSummary {
	type: 'corsi';
	forwardSpan: number;
	backwardSpan: number;
	forwardScore: number;
	backwardScore: number;
	totalScore: number;
	meanResponseTime: number;
}

export interface SymbolDigitSummary {
	type: 'symbol-digit';
	totalCorrect: number;
	totalAttempted: number;
	totalErrors: number;
	timeLimit: number;
	throughput: number;
}

export interface TrailMakingSummary {
	type: 'trail-making';
	variant: 'A' | 'B';
	completionTimeMs: number;
	errors: number;
	pathSegmentTimes: number[];
}

export interface WCSTSummary {
	type: 'wcst';
	totalTrials: number;
	categoriesCompleted: number;
	totalErrors: number;
	perseverativeResponses: number;
	perseverativeErrors: number;
	nonPerseverativeErrors: number;
	conceptualLevelResponses: number;
	failureToMaintainSet: number;
	trialsToFirstCategory: number;
}

export interface TowerSummary {
	type: 'tower';
	problemsSolved: number;
	totalProblems: number;
	totalMoves: number;
	optimalMoves: number;
	excessMoves: number;
	meanPlanningTime: number;
	meanExecutionTime: number;
	ruleViolations: number;
	/** Problems solved in the minimum number of moves */
	problemsSolvedOptimally: number;
	/** Initial planning time on correctly solved problems only */
	meanPlanningTimeSolved: number;
	timeouts: number;
}

export interface WordListSummary {
	type: 'word-list';
	learningTrials: number;
	/** Correct words per learning trial A1–A5 */
	wordsPerTrial: number[];
	/** A5 */
	totalLearned: number;
	/** Σ A1–A5 (RAVLT total learning) */
	totalRecall: number;
	learningSlope: number;
	/** Learning over trials: Σ A1–A5 − 5 × A1 */
	learningOverTrials: number;
	/** List B recall */
	interferenceRecall: number;
	/** B / A1 (lower = stronger proactive interference) */
	proactiveInterference: number;
	/** A6 / A5 (lower = stronger retroactive interference) */
	retroactiveInterference: number;
	/** A6: recall of list A after list B */
	shortDelayFreeRecall: number;
	/** Non-list words over all recall trials */
	intrusions: number;
	/** Proportion recalled of the first / last 5 list positions over A1–A5 */
	primacy: number;
	recency: number;
	presentationMode: 'auditory' | 'visual';
}

export interface DelayedRecallSummary {
	type: 'delayed-recall';
	/** A5 of the word-list test */
	immediateRecall: number;
	/** A6 of the word-list test */
	shortDelayRecall: number;
	/** A7 */
	delayedRecall: number;
	/** A7 / A5 */
	retentionRate: number;
	delayMinutes: number;
	totalItems: number;
	intrusionErrors: number;
	recognitionHits: number;
	recognitionFalseAlarms: number;
	/** "Yes" to list-B words (source confusion) */
	recognitionListBErrors: number;
	/** Hits − false alarms */
	recognitionDiscriminability: number;
	dPrimeRecognition: number;
}

export interface ReyFigureSummary {
	type: 'rey-figure';
	immediateHits: number;
	immediateFalseAlarms: number;
	immediateTargets: number;
	immediateDistractors: number;
	immediateDPrime: number;
	immediateTimeMs: number;
	delayedHits: number;
	delayedFalseAlarms: number;
	delayedTargets: number;
	delayedDistractors: number;
	delayedDPrime: number;
	delayedTimeMs: number;
	delayMinutes: number;
}
