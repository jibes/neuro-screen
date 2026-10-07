import type { WCSTCard, WCSTRule, WCSTTrialResult } from './types.js';
import type { WCSTSummary } from '$lib/db/models.js';
import { WCST_CONFIG } from './config.js';
import { shuffled } from '$lib/utils/random.js';

const colors = ['rot', 'blau', 'gruen', 'gelb'] as const;
const shapes = ['kreis', 'dreieck', 'stern', 'kreuz'] as const;
const counts = [1, 2, 3, 4] as const;

/**
 * Generate a test card that is ambiguous — matches different reference cards on different dimensions.
 */
export function generateTestCard(): WCSTCard {
	const refs = WCST_CONFIG.referenceCards;
	// Pick color from one ref, shape from another, count from a third
	const indices = shuffled([0, 1, 2, 3]);
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

	for (let i = 0; i < results.length; i++) {
		const r = results[i];

		// Perseverative response: matches the previous category's rule, regardless of correctness.
		// (With the unambiguous test cards used here a correct response can never match the old rule,
		// so responses and errors coincide; both are reported per Heaton's definitions.)
		const perseverative = prevRule !== null && matchesRule(r.testCard, r.selectedRefIndex, prevRule);
		if (perseverative) perseverativeResponses++;

		if (r.correct) {
			consecutiveCorrect++;
			// Conceptual level responses: every response within a run of 3+ consecutive correct
			if (consecutiveCorrect === 3) conceptualLevelResponses += 3;
			else if (consecutiveCorrect > 3) conceptualLevelResponses++;
		} else {
			totalErrors++;
			// Failure to maintain set: error after 5+ consecutive correct before completing the category
			if (consecutiveCorrect >= 5) failureToMaintainSet++;
			consecutiveCorrect = 0;

			if (perseverative) perseverativeErrors++;
			else nonPerseverativeErrors++;
		}

		// Category completed
		if (consecutiveCorrect >= WCST_CONFIG.correctToSwitch) {
			categoriesCompleted++;
			if (!firstCategoryFound) {
				trialsToFirstCategory = i + 1;
				firstCategoryFound = true;
			}
			consecutiveCorrect = 0;
			prevRule = WCST_CONFIG.ruleSequence[currentRuleIndex % WCST_CONFIG.ruleSequence.length];
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
