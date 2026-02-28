import { t } from '$lib/i18n/index.js';
import type { TowerProblem } from './types.js';

const i = t();

export const TOWER_CONFIG = {
	testId: 'tower',
	testName: i.tests.tower.name,
	instructions: i.tests.tower.instructions,

	pegCapacities: [3, 2, 1] as const,
	discColors: ['rot', 'blau', 'gruen'] as const,
	colorHex: {
		rot: '#dc2626',
		blau: '#2563eb',
		gruen: '#16a34a'
	} as Record<string, string>,

	problems: [
		{
			id: 1,
			initial: { pegs: [['rot', 'blau', 'gruen'], [], []] },
			goal: { pegs: [['rot', 'blau'], ['gruen'], []] },
			optimalMoves: 1,
			maxMoves: 4
		},
		{
			id: 2,
			initial: { pegs: [['rot', 'blau', 'gruen'], [], []] },
			goal: { pegs: [['rot'], ['blau'], ['gruen']] },
			optimalMoves: 2,
			maxMoves: 6
		},
		{
			id: 3,
			initial: { pegs: [['rot'], ['blau'], ['gruen']] },
			goal: { pegs: [['rot', 'blau', 'gruen'], [], []] },
			optimalMoves: 2,
			maxMoves: 6
		},
		{
			id: 4,
			initial: { pegs: [['rot', 'blau', 'gruen'], [], []] },
			goal: { pegs: [['rot', 'gruen'], ['blau'], []] },
			optimalMoves: 3,
			maxMoves: 9
		},
		{
			id: 5,
			initial: { pegs: [['rot', 'blau'], ['gruen'], []] },
			goal: { pegs: [['blau'], ['gruen'], ['rot']] },
			optimalMoves: 3,
			maxMoves: 9
		},
		{
			id: 6,
			initial: { pegs: [[], ['rot', 'blau'], ['gruen']] },
			goal: { pegs: [['blau'], ['gruen'], ['rot']] },
			optimalMoves: 4,
			maxMoves: 10
		},
		{
			id: 7,
			initial: { pegs: [['rot', 'blau', 'gruen'], [], []] },
			goal: { pegs: [['blau', 'gruen'], [], ['rot']] },
			optimalMoves: 5,
			maxMoves: 12
		},
		{
			id: 8,
			initial: { pegs: [['rot', 'blau', 'gruen'], [], []] },
			goal: { pegs: [['blau', 'gruen'], ['rot'], []] },
			optimalMoves: 6,
			maxMoves: 14
		},
		{
			id: 9,
			initial: { pegs: [['rot', 'blau', 'gruen'], [], []] },
			goal: { pegs: [['gruen'], ['rot'], ['blau']] },
			optimalMoves: 7,
			maxMoves: 16
		},
		{
			id: 10,
			initial: { pegs: [['rot', 'blau', 'gruen'], [], []] },
			goal: { pegs: [['gruen', 'blau', 'rot'], [], []] },
			optimalMoves: 7,
			maxMoves: 16
		}
	] as TowerProblem[]
} as const;
