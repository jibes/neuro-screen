import { t } from '$lib/i18n/index.js';
import type { TrailNode } from './types.js';

const i = t();

// Sequence: 1, A, 2, B, 3, C, ..., 12, L, 13
const labels = [
	'1', 'A', '2', 'B', '3', 'C', '4', 'D', '5', 'E',
	'6', 'F', '7', 'G', '8', 'H', '9', 'I', '10', 'J',
	'11', 'K', '12', 'L', '13'
];

export const TRAIL_B_CONFIG = {
	testId: 'trail-making-b',
	testName: i.tests.trailMakingB.name,
	instructions: i.tests.trailMakingB.instructions,

	variant: 'B' as const,
	nodeCount: 25,
	nodeRadius: 20,

	nodePositions: [
		{ id: 0, label: '1', x: 40, y: 50, kind: 'number' },
		{ id: 1, label: 'A', x: 60, y: 30, kind: 'letter' },
		{ id: 2, label: '2', x: 80, y: 42, kind: 'number' },
		{ id: 3, label: 'B', x: 70, y: 60, kind: 'letter' },
		{ id: 4, label: '3', x: 50, y: 72, kind: 'number' },
		{ id: 5, label: 'C', x: 25, y: 65, kind: 'letter' },
		{ id: 6, label: '4', x: 10, y: 45, kind: 'number' },
		{ id: 7, label: 'D', x: 22, y: 25, kind: 'letter' },
		{ id: 8, label: '5', x: 45, y: 15, kind: 'number' },
		{ id: 9, label: 'E', x: 68, y: 10, kind: 'letter' },
		{ id: 10, label: '6', x: 88, y: 20, kind: 'number' },
		{ id: 11, label: 'F', x: 92, y: 45, kind: 'letter' },
		{ id: 12, label: '7', x: 85, y: 72, kind: 'number' },
		{ id: 13, label: 'G', x: 65, y: 85, kind: 'letter' },
		{ id: 14, label: '8', x: 42, y: 90, kind: 'number' },
		{ id: 15, label: 'H', x: 20, y: 82, kind: 'letter' },
		{ id: 16, label: '9', x: 8, y: 65, kind: 'number' },
		{ id: 17, label: 'I', x: 5, y: 38, kind: 'letter' },
		{ id: 18, label: '10', x: 15, y: 12, kind: 'number' },
		{ id: 19, label: 'J', x: 35, y: 5, kind: 'letter' },
		{ id: 20, label: '11', x: 55, y: 55, kind: 'number' },
		{ id: 21, label: 'K', x: 38, y: 35, kind: 'letter' },
		{ id: 22, label: '12', x: 78, y: 90, kind: 'number' },
		{ id: 23, label: 'L', x: 92, y: 78, kind: 'letter' },
		{ id: 24, label: '13', x: 90, y: 8, kind: 'number' }
	] as TrailNode[]
} as const;
