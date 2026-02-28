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
}

export interface FlankerSummary {
	type: 'flanker';
	totalTrials: number;
	congruentTrials: number;
	incongruentTrials: number;
	meanRtCongruent: number;
	meanRtIncongruent: number;
	flankerEffect: number;
	errorsCongruent: number;
	errorsIncongruent: number;
	accuracy: number;
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
	accuracy: number;
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
	dPrime: number;
	accuracy: number;
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
	dPrime: number;
	variabilityIndex: number;
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
}

export interface WordListSummary {
	type: 'word-list';
	learningTrials: number;
	wordsPerTrial: number[];
	totalLearned: number;
	learningSlope: number;
	shortDelayFreeRecall: number;
	longDelayFreeRecall: number;
	recognitionHits: number;
	recognitionFalseAlarms: number;
	dPrimeRecognition: number;
}

export interface DelayedRecallSummary {
	type: 'delayed-recall';
	immediateRecall: number;
	delayedRecall: number;
	retentionRate: number;
	delayMinutes: number;
	totalItems: number;
	intrusionErrors: number;
}

export interface ReyFigureSummary {
	type: 'rey-figure';
	copyScore: number;
	copyTimeMs: number;
	recallScore: number;
	recallTimeMs: number;
	delayMinutes: number;
	retentionRate: number;
}
