export interface CorsiBlock {
	id: number;
	x: number;
	y: number;
}

export interface CorsiTrial {
	sequence: number[];
	spanLength: number;
	attemptNumber: number;
}

export interface CorsiResult {
	trial: CorsiTrial;
	userResponse: number[];
	correct: boolean;
	responseTimeMs: number;
}
