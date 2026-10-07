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

/**
 * Order `items` randomly such that every element satisfies `allowed(sequenceSoFar, candidate)`.
 * Greedy random construction with restarts; used for counterbalancing constraints such as
 * "no more than 3 trials of the same condition in a row" or "no response repetition".
 * Falls back to an unconstrained shuffle if no valid order is found.
 */
export function constrainedShuffle<T>(
	items: readonly T[],
	allowed: (sequence: T[], candidate: T) => boolean,
	maxRestarts = 500
): T[] {
	for (let attempt = 0; attempt < maxRestarts; attempt++) {
		const pool = shuffled(items);
		const sequence: T[] = [];
		while (pool.length > 0) {
			const idx = pool.findIndex((candidate) => allowed(sequence, candidate));
			if (idx === -1) break;
			sequence.push(pool.splice(idx, 1)[0]);
		}
		if (sequence.length === items.length) return sequence;
	}
	console.warn('constrainedShuffle: constraints not satisfiable, using unconstrained order');
	return shuffled(items);
}

/** True if appending `next` would create a run longer than `maxRun` of equal keys */
export function exceedsRun<T>(sequence: T[], next: T, key: (item: T) => unknown, maxRun: number): boolean {
	if (sequence.length < maxRun) return false;
	const k = key(next);
	for (let i = sequence.length - maxRun; i < sequence.length; i++) {
		if (key(sequence[i]) !== k) return false;
	}
	return true;
}

/** Deterministic PRNG (mulberry32) for standardised, reproducible stimulus orders */
export function seededRandom(seed: number): () => number {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/** Fisher-Yates shuffle with a supplied random source (returns a copy) */
export function seededShuffle<T>(array: readonly T[], rand: () => number): T[] {
	const a = [...array];
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(rand() * (i + 1));
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
}
