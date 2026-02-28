import { t } from '$lib/i18n/index.js';
import type { TrailNode } from './types.js';

const i = t();

export const TRAIL_A_CONFIG = {
	testId: 'trail-making-a',
	testName: i.tests.trailMakingA.name,
	instructions: i.tests.trailMakingA.instructions,

	variant: 'A' as const,
	nodeCount: 25,
	nodeRadius: 20,

	nodePositions: [
		{ id: 1, label: '1', x: 35, y: 45 },
		{ id: 2, label: '2', x: 55, y: 20 },
		{ id: 3, label: '3', x: 78, y: 35 },
		{ id: 4, label: '4', x: 65, y: 55 },
		{ id: 5, label: '5', x: 45, y: 65 },
		{ id: 6, label: '6', x: 20, y: 58 },
		{ id: 7, label: '7', x: 12, y: 35 },
		{ id: 8, label: '8', x: 30, y: 18 },
		{ id: 9, label: '9', x: 48, y: 8 },
		{ id: 10, label: '10', x: 70, y: 12 },
		{ id: 11, label: '11', x: 88, y: 22 },
		{ id: 12, label: '12', x: 90, y: 48 },
		{ id: 13, label: '13', x: 82, y: 70 },
		{ id: 14, label: '14', x: 60, y: 80 },
		{ id: 15, label: '15', x: 38, y: 85 },
		{ id: 16, label: '16', x: 18, y: 78 },
		{ id: 17, label: '17', x: 8, y: 60 },
		{ id: 18, label: '18', x: 5, y: 42 },
		{ id: 19, label: '19', x: 15, y: 15 },
		{ id: 20, label: '20', x: 42, y: 35 },
		{ id: 21, label: '21', x: 58, y: 42 },
		{ id: 22, label: '22', x: 75, y: 88 },
		{ id: 23, label: '23', x: 50, y: 92 },
		{ id: 24, label: '24', x: 28, y: 68 },
		{ id: 25, label: '25', x: 92, y: 60 }
	] as TrailNode[]
} as const;
