import { t } from '$lib/i18n/index.js';
import type { WCSTCard } from './types.js';

const i = t();

export const WCST_CONFIG = {
	testId: 'wcst',
	testName: i.tests.wcst.name,
	instructions: i.tests.wcst.instructions,

	maxTrials: 128,
	maxCategories: 6,
	correctToSwitch: 10,
	ruleSequence: ['color', 'shape', 'number'] as const,
	feedbackDurationMs: 1000,

	referenceCards: [
		{ color: 'rot', shape: 'dreieck', count: 1 },
		{ color: 'gruen', shape: 'stern', count: 2 },
		{ color: 'gelb', shape: 'kreuz', count: 3 },
		{ color: 'blau', shape: 'kreis', count: 4 }
	] as WCSTCard[],

	colorHex: {
		rot: '#dc2626',
		blau: '#2563eb',
		gruen: '#16a34a',
		gelb: '#ca8a04'
	} as Record<string, string>,

	shapePaths: {
		kreis: 'M 50,15 a 35,35 0 1,0 0.001,0 Z',
		dreieck: 'M 50,10 L 90,85 L 10,85 Z',
		stern: 'M 50,5 L 61,38 L 95,38 L 68,58 L 79,92 L 50,72 L 21,92 L 32,58 L 5,38 L 39,38 Z',
		kreuz: 'M 35,10 L 65,10 L 65,35 L 90,35 L 90,65 L 65,65 L 65,90 L 35,90 L 35,65 L 10,65 L 10,35 L 35,35 Z'
	} as Record<string, string>
} as const;
