import type { WCSTCard, WCSTRule, WCSTTrialResult } from './types.js';
import type { WCSTSummary } from '$lib/db/models.js';
import { WCST_CONFIG } from './config.js';
import { pick } from '$lib/utils/random.js';

const colors = ['rot', 'blau', 'gruen', 'gelb'] as const;
const shapes = ['kreis', 'dreieck', 'stern', 'kreuz'] as const;
const counts = [1, 2, 3, 4] as const;

/**
 * Generate a test card that is ambiguous — matches different reference cards on different dimensions.
 */
export function generateTestCard(): WCSTCard {
	const refs = WCST_CONFIG.referenceCards;
	// Pick color from one ref, shape from another, count from a third
	const indices = [0, 1, 2, 3].sort(() => Math.random() - 0.5);
	return {
		color: refs[indices[0]].color,
		shape: refs[indices[1]].shape,
		count: refs[indices[2]].count
	};
}

/**
 * Find which dimensions a test card matches a given reference card on.
 */
export function getMatchedDimensions(testCard: WCSTCard, refCard: WCSTCard): WCSTRule[] {
	const matches: WCSTRule[] = [];
	if (testCard.color === refCard.color) matches.push('color');
	if (testCard.shape === refCard.shape) matches.push('shape');
	if (testCard.count === refCard.count) matches.push('number');
	return matches;
}

/**
 * Check if a selection is correct under the current rule.
 */
export function isCorrectMatch(testCard: WCSTCard, refIndex: number, currentRule: WCSTRule): boolean {
	const ref = WCST_CONFIG.referenceCards[refIndex];
	switch (currentRule) {
		case 'color': return testCard.color === ref.color;
		case 'shape': return testCard.shape === ref.shape;
		case 'number': return testCard.count === ref.count;
	}
}

/**
 * Check if response would have been correct under a different (previous) rule.
 */
export function matchesRule(testCard: WCSTCard, refIndex: number, rule: WCSTRule): boolean {
	return isCorrectMatch(testCard, refIndex, rule);
}

export function computeSummary(results: WCSTTrialResult[]): WCSTSummary {
	let categoriesCompleted = 0;
	let totalErrors = 0;
	let perseverativeResponses = 0;
	let perseverativeErrors = 0;
	let nonPerseverativeErrors = 0;
	let conceptualLevelResponses = 0;
	let failureToMaintainSet = 0;
	let trialsToFirstCategory = 0;
	let firstCategoryFound = false;

	let consecutiveCorrect = 0;
	let currentRuleIndex = 0;
	let prevRule: WCSTRule | null = null;
	let runOfCorrect = 0;

	for (let i = 0; i < results.length; i++) {
		const r = results[i];

		if (r.correct) {
			consecutiveCorrect++;
			runOfCorrect++;
		} else {
			totalErrors++;

			// Failure to maintain set: had 5+ correct but failed before reaching 10
			if (runOfCorrect >= 5) {
				failureToMaintainSet++;
			}
			runOfCorrect = 0;

			if (r.isPerseverative) {
				perseverativeResponses++;
				perseverativeErrors++;
			} else {
				nonPerseverativeErrors++;
			}
		}

		// Conceptual level: runs of 3+ correct
		if (runOfCorrect >= 3 && r.correct) {
			conceptualLevelResponses++;
		}

		// Category completed
		if (consecutiveCorrect >= WCST_CONFIG.correctToSwitch) {
			categoriesCompleted++;
			if (!firstCategoryFound) {
				trialsToFirstCategory = i + 1;
				firstCategoryFound = true;
			}
			consecutiveCorrect = 0;
			runOfCorrect = 0;
			prevRule = WCST_CONFIG.ruleSequence[currentRuleIndex % 3];
			currentRuleIndex++;
		}
	}

	if (!firstCategoryFound) {
		trialsToFirstCategory = results.length;
	}

	return {
		type: 'wcst',
		totalTrials: results.length,
		categoriesCompleted,
		totalErrors,
		perseverativeResponses,
		perseverativeErrors,
		nonPerseverativeErrors,
		conceptualLevelResponses,
		failureToMaintainSet,
		trialsToFirstCategory
	};
}
