import { t } from '$lib/i18n/index.js';
import { jitteredISI } from '$lib/core/constants.js';

const i = t();

export const GO_NOGO_CONFIG = {
	testId: 'go-nogo',
	testName: i.tests.goNogo.name,
	instructions: i.tests.goNogo.instructions,

	totalTrials: 60,
	goRatio: 0.75,
	stimulusDuration: 500,
	fixationDuration: 500,
	responseWindow: 1000,
	feedbackDuration: 500,
	itiDuration: () => jitteredISI(1000, 400),

	goColor: '#22c55e',      // green-500
	noGoColor: '#ef4444',    // red-500
	stimulusSizePx: 120,
	responseKey: ' ',        // spacebar

	practiceTrials: 10,
	practiceGoRatio: 0.7,
	practiceAccuracyThreshold: 0.6
} as const;
