import { t } from '$lib/i18n/index.js';
import { jitteredISI } from '$lib/core/constants.js';

const i = t();

export const NBACK_CONFIG = {
	testId: 'n-back',
	testName: i.tests.nBack.name,
	instructions: i.tests.nBack.instructions,

	nLevel: 2,
	totalTrials: 60,
	targetRatio: 0.3,
	stimulusDuration: 500,
	fixationDuration: 0,
	responseWindow: 2000,
	feedbackDuration: 500, // only used for practice feedback
	itiDuration: () => jitteredISI(500, 200),

	letters: 'BCDFGHJKLMNPQRSTVWXYZ'.split(''),
	responseKey: ' ',

	practiceTrials: 15,
	practiceAccuracyThreshold: 0.6,
	maxPracticeAttempts: 3
} as const;
