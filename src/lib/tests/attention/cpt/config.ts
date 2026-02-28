import { t } from '$lib/i18n/index.js';
import { jitteredISI } from '$lib/core/constants.js';

const i = t();

export const CPT_CONFIG = {
	testId: 'cpt',
	testName: i.tests.cpt.name,
	instructions: i.tests.cpt.instructions,

	totalTrials: 200,
	targetRatio: 0.2,
	stimulusDuration: 250,
	fixationDuration: 0,
	responseWindow: 1000,
	feedbackDuration: 0,
	itiDuration: () => jitteredISI(750, 200),

	targetLetter: 'X',
	nonTargetLetters: 'ABCDEFGHIJKLMNOPQRSTUVWYZ'.split(''),
	responseKey: ' ',
	blocksCount: 4,
	trialsPerBlock: 50
} as const;
