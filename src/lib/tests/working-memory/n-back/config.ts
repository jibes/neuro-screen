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
	feedbackDuration: 0,
	itiDuration: () => jitteredISI(500, 200),

	letters: 'BCDFGHJKLMNPQRSTVWXYZ'.split(''),
	responseKey: ' '
} as const;
