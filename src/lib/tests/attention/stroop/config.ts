import { t } from '$lib/i18n/index.js';
import { jitteredISI } from '$lib/core/constants.js';

const i = t();

export const STROOP_CONFIG = {
	testId: 'stroop',
	testName: i.tests.stroop.name,
	instructions: i.tests.stroop.instructions,

	totalTrials: 90,
	trialsPerCondition: 30,
	stimulusDuration: null as number | null,
	fixationDuration: 500,
	responseWindow: 2000,
	feedbackDuration: 500,
	itiDuration: () => jitteredISI(1000, 400),

	colors: ['rot', 'blau', 'gruen', 'gelb'] as const,
	words: ['ROT', 'BLAU', 'GRUEN', 'GELB'] as const,
	neutralWord: 'XXXX',

	keyMap: { 'd': 'rot', 'f': 'blau', 'j': 'gruen', 'k': 'gelb' } as Record<string, string>,
	responseKeys: ['d', 'f', 'j', 'k'],

	colorHex: {
		rot: '#dc2626',
		blau: '#2563eb',
		gruen: '#16a34a',
		gelb: '#ca8a04'
	} as Record<string, string>
} as const;
