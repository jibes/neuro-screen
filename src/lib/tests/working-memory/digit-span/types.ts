export type SpanDirection = 'forward' | 'backward';

export interface DigitSpanTrial {
	digits: number[];
	spanLength: number;
	attemptNumber: number; // 1 or 2 for each span length
	direction: SpanDirection;
}

export interface DigitSpanResult {
	trial: DigitSpanTrial;
	userResponse: number[];
	correct: boolean;
	responseTimeMs: number;
}
