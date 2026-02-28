export interface TrailNode {
	id: number;
	label: string;
	x: number;
	y: number;
	kind: 'number' | 'letter';
}

export interface TrailMakingResult {
	completionTimeMs: number;
	errors: number;
	pathSegmentTimes: number[];
	clickLog: Array<{
		clickedId: number;
		expectedId: number;
		correct: boolean;
		timestamp: number;
	}>;
}
