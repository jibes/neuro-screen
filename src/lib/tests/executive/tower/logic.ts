import type { TowerState, TowerProblemResult, DiscColor } from './types.js';
import type { TowerSummary } from '$lib/db/models.js';
import { TOWER_CONFIG } from './config.js';
import { mean } from '$lib/utils/statistics.js';

export function cloneState(state: TowerState): TowerState {
	return { pegs: state.pegs.map((p) => [...p]) };
}

export function isValidMove(state: TowerState, fromPeg: number, toPeg: number): boolean {
	if (fromPeg === toPeg) return false;
	if (state.pegs[fromPeg].length === 0) return false;
	if (state.pegs[toPeg].length >= TOWER_CONFIG.pegCapacities[toPeg]) return false;
	return true;
}

export function applyMove(state: TowerState, fromPeg: number, toPeg: number): TowerState {
	const newState = cloneState(state);
	const disc = newState.pegs[fromPeg].pop()!;
	newState.pegs[toPeg].push(disc);
	return newState;
}

export function isGoalReached(state: TowerState, goal: TowerState): boolean {
	for (let p = 0; p < state.pegs.length; p++) {
		if (state.pegs[p].length !== goal.pegs[p].length) return false;
		for (let d = 0; d < state.pegs[p].length; d++) {
			if (state.pegs[p][d] !== goal.pegs[p][d]) return false;
		}
	}
	return true;
}

export function computeSummary(results: TowerProblemResult[]): TowerSummary {
	const solved = results.filter((r) => r.solved);
	const totalMoves = results.reduce((sum, r) => sum + r.moves, 0);
	const optimalMoves = results.reduce((sum, r) => sum + r.problem.optimalMoves, 0);
	const planningTimes = results.map((r) => r.planningTimeMs);
	const executionTimes = solved.map((r) => r.executionTimeMs);
	const violations = results.reduce((sum, r) => sum + r.ruleViolations, 0);

	return {
		type: 'tower',
		problemsSolved: solved.length,
		totalProblems: results.length,
		totalMoves,
		optimalMoves,
		excessMoves: totalMoves - optimalMoves,
		meanPlanningTime: mean(planningTimes),
		meanExecutionTime: mean(executionTimes),
		ruleViolations: violations
	};
}
