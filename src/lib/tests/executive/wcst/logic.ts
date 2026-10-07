import type { WCSTCard, WCSTRule, WCSTTrialResult } from './types.js';
import type { WCSTSummary } from '$lib/db/models.js';
import { WCST_CONFIG } from './config.js';
import { seededRandom, seededShuffle } from '$lib/utils/random.js';

const colors = ['rot', 'blau', 'gruen', 'gelb'] as const;
const shapes = ['kreis', 'dreieck', 'stern', 'kreuz'] as const;
const counts = [1, 2, 3, 4] as const;

/**
 * Standardised response deck as in the Heaton WCST: two decks of all 64 colour × shape × number
 * combinations (incl. ambiguous cards that match a key card on several dimensions).
 * The order is fixed (seeded) so every administration uses the same card sequence.
 */
export function generateDeck(): WCSTCard[] {
	const all: WCSTCard[] = [];
	for (const color of colors) for (const shape of shapes) for (const count of counts) all.push({ color, shape, count });
	const rand = seededRandom(WCST_CONFIG.deckSeed);
	const deck = [...seededShuffle(all, rand), ...seededShuffle(all, rand)];
	return deck.slice(0, WCST_CONFIG.maxTrials);
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

/**
 * Perseveration scoring after Heaton et al. (1993), simplified:
 * - The perseverated-to principle is the rule of the previous category; before the first
 *   category is completed it is set by the first unambiguous error.
 * - Three consecutive unambiguous errors to another dimension establish a new principle.
 * - Unambiguous responses matching the principle are perseverative; ambiguous ones (matching
 *   the principle and another dimension) only if "sandwiched" between unambiguous
 *   perseverative responses (sandwich rule).
 * @returns per-trial perseveration flags
 */
export function scorePerseveration(results: WCSTTrialResult[]): boolean[] {
	const perseverative = Array(results.length).fill(false);
	const ambiguousCandidate = Array(results.length).fill(false);
	let principle: WCSTRule | null = null;
	let newRule: WCSTRule | null = null;
	let newRuleCount = 0;

	for (let i = 0; i < results.length; i++) {
		const r = results[i];
		if (i > 0 && r.currentRule !== results[i - 1].currentRule) {
			principle = results[i - 1].currentRule; // category just completed
			newRule = null;
			newRuleCount = 0;
		}
		const unambiguous = r.matchedDimensions.length === 1;

		if (principle === null && !r.correct && unambiguous) {
			principle = r.matchedDimensions[0];
		}

		if (principle !== null && r.matchedDimensions.includes(principle)) {
			if (unambiguous) perseverative[i] = true;
			else ambiguousCandidate[i] = true;
		}

		// Principle shift: 3 consecutive unambiguous errors to the same other dimension
		if (!r.correct && unambiguous && r.matchedDimensions[0] !== principle) {
			const dim: WCSTRule = r.matchedDimensions[0];
			newRuleCount = newRule === dim ? newRuleCount + 1 : 1;
			newRule = dim;
			if (newRuleCount >= 3) {
				principle = dim;
				newRule = null;
				newRuleCount = 0;
			}
		} else {
			newRule = null;
			newRuleCount = 0;
		}
	}

	// Sandwich rule for ambiguous responses
	for (let i = 0; i < results.length; i++) {
		if (!ambiguousCandidate[i]) continue;
		let j = i - 1;
		while (j >= 0 && ambiguousCandidate[j]) j--;
		let k = i + 1;
		while (k < results.length && ambiguousCandidate[k]) k++;
		if (j >= 0 && k < results.length && perseverative[j] && perseverative[k] &&
			results[j].matchedDimensions.length === 1 && results[k].matchedDimensions.length === 1) {
			perseverative[i] = true;
		}
	}
	return perseverative;
}

export function computeSummary(results: WCSTTrialResult[]): WCSTSummary {
	const perseverative = scorePerseveration(results);
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

	for (let i = 0; i < results.length; i++) {
		const r = results[i];
		if (perseverative[i]) perseverativeResponses++;

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
			if (perseverative[i]) perseverativeErrors++;
			else nonPerseverativeErrors++;
		}

		if (consecutiveCorrect >= WCST_CONFIG.correctToSwitch) {
			categoriesCompleted++;
			if (!firstCategoryFound) {
				trialsToFirstCategory = i + 1;
				firstCategoryFound = true;
			}
			consecutiveCorrect = 0;
		}
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
		trialsToFirstCategory: firstCategoryFound ? trialsToFirstCategory : results.length
	};
}
