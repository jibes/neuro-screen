/** Fisher-Yates shuffle (in-place, returns the same array) */
export function shuffle<T>(array: T[]): T[] {
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}
	return array;
}

/** Create a shuffled copy of an array */
export function shuffled<T>(array: readonly T[]): T[] {
	return shuffle([...array]);
}

/** Pick a random element from an array */
export function pick<T>(array: readonly T[]): T {
	return array[Math.floor(Math.random() * array.length)];
}

/**
 * Generate a randomized trial sequence respecting a given ratio.
 * E.g., generateTrialSequence(60, 0.75) → 45 true, 15 false, shuffled.
 */
export function generateTrialSequence(total: number, ratio: number): boolean[] {
	const trueCount = Math.round(total * ratio);
	const falseCount = total - trueCount;
	const sequence: boolean[] = [
		...Array(trueCount).fill(true),
		...Array(falseCount).fill(false)
	];
	return shuffle(sequence);
}

/** Generate a random integer in [min, max] inclusive */
export function randomInt(min: number, max: number): number {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}
