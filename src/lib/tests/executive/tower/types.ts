export type DiscColor = 'rot' | 'blau' | 'gruen';

export interface TowerState {
	pegs: DiscColor[][];
}

export interface TowerProblem {
	id: number;
	initial: TowerState;
	goal: TowerState;
	optimalMoves: number;
	maxMoves: number;
}

export interface TowerProblemResult {
	problem: TowerProblem;
	moves: number;
	planningTimeMs: number;
	executionTimeMs: number;
	solved: boolean;
	ruleViolations: number;
}
