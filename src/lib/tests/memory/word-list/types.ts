export interface RecallResult {
	phase: 'learning' | 'interference' | 'shortDelay' | 'recognition';
	trialNumber: number;
	recalledWords: string[];
	correctCount: number;
	intrusionCount: number;
	responseTimeMs: number;
}

export interface RecognitionItem {
	word: string;
	isTarget: boolean;
	userSaidYes: boolean;
	correct: boolean;
	rt: number;
}
