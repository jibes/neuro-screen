import { t } from '$lib/i18n/index.js';
import { jitteredISI } from '$lib/core/constants.js';

const i = t();

export const FLANKER_CONFIG = {
	testId: 'flanker',
	testName: i.tests.flanker.name,
	instructions: i.tests.flanker.instructions,

	totalTrials: 80,
	congruentRatio: 0.5,
	stimulusDuration: null as number | null, // until response
	fixationDuration: 500,
	responseWindow: 1500,
	feedbackDuration: 500,
	itiDuration: () => jitteredISI(1000, 400),

	responseKeys: ['ArrowLeft', 'ArrowRight'],
	leftKey: 'ArrowLeft',
	rightKey: 'ArrowRight',

	practiceTrials: 12,
	practiceAccuracyThreshold: 0.6
} as const;
