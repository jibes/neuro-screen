export interface CorsiBlock {
	id: number;
	x: number;
	y: number;
}

export type CorsiDirection = 'forward' | 'backward';

export interface CorsiTrial {
	sequence: number[];
	spanLength: number;
	attemptNumber: number;
	direction: CorsiDirection;
}

export interface CorsiResult {
	trial: CorsiTrial;
	userResponse: number[];
	correct: boolean;
	responseTimeMs: number;
}
