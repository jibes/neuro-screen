import Dexie, { type Table } from 'dexie';
import type { Session, TestRun, TrialData } from './models.js';

export class NeuroDB extends Dexie {
	sessions!: Table<Session>;
	testRuns!: Table<TestRun>;
	trials!: Table<TrialData>;

	constructor() {
		super('NeuroScreen');
		this.version(1).stores({
			sessions: '++id, startedAt',
			testRuns: '++id, sessionId, testId, startedAt',
			trials: '++id, testRunId, trialNumber'
		});
	}
}

export const db = new NeuroDB();

/** Create a new session and return its ID */
export async function createSession(session: Omit<Session, 'id'>): Promise<number> {
	return await db.sessions.add(session as Session);
}

/** Get the most recent session */
export async function getLatestSession(): Promise<Session | undefined> {
	return await db.sessions.orderBy('startedAt').last();
}

/** Remove undefined values and functions from an object (recursive) for IndexedDB compatibility */
function sanitizeForStorage(obj: unknown): unknown {
	if (obj === null || obj === undefined) return null;
	if (typeof obj === 'function') return null;
	if (Array.isArray(obj)) return obj.map(sanitizeForStorage);
	if (typeof obj === 'object') {
		const result: Record<string, unknown> = {};
		for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
			if (value !== undefined && typeof value !== 'function') {
				result[key] = sanitizeForStorage(value);
			}
		}
		return result;
	}
	return obj;
}

/** Save a completed test run with its trial data */
export async function saveTestRun(
	testRun: Omit<TestRun, 'id'>,
	trials: Omit<TrialData, 'id' | 'testRunId'>[]
): Promise<number> {
	if (!testRun.sessionId) {
		throw new Error('saveTestRun: keine gueltige sessionId');
	}

	// Sanitize to remove undefined/function values that IndexedDB cannot store
	const sanitizedRun = sanitizeForStorage(testRun) as Omit<TestRun, 'id'>;

	return await db.transaction('rw', db.testRuns, db.trials, db.sessions, async () => {
		const testRunId = await db.testRuns.add(sanitizedRun as TestRun);

		if (trials.length > 0) {
			await db.trials.bulkAdd(
				trials.map((t) => ({ ...sanitizeForStorage(t) as object, testRunId }) as TrialData)
			);
		}

		// Update session's completed tests
		const session = await db.sessions.get(testRun.sessionId);
		if (session && !session.completedTests.includes(testRun.testId)) {
			await db.sessions.update(testRun.sessionId, {
				completedTests: [...session.completedTests, testRun.testId]
			});
		}

		return testRunId;
	});
}

/** Get all test runs for a session */
export async function getTestRuns(sessionId: number): Promise<TestRun[]> {
	return await db.testRuns.where('sessionId').equals(sessionId).sortBy('startedAt');
}

/** Get a specific test run */
export async function getTestRun(testRunId: number): Promise<TestRun | undefined> {
	return await db.testRuns.get(testRunId);
}

/** Get all trials for a test run */
export async function getTrials(testRunId: number): Promise<TrialData[]> {
	return await db.trials.where('testRunId').equals(testRunId).sortBy('trialNumber');
}

/** Get the latest test run for a specific test */
export async function getLatestTestRun(sessionId: number, testId: string): Promise<TestRun | undefined> {
	const runs = await db.testRuns
		.where('sessionId').equals(sessionId)
		.filter((r) => r.testId === testId)
		.toArray();
	return runs.length > 0 ? runs[runs.length - 1] : undefined;
}

/** Delete all data */
export async function clearAllData(): Promise<void> {
	await db.transaction('rw', db.sessions, db.testRuns, db.trials, async () => {
		await db.sessions.clear();
		await db.testRuns.clear();
		await db.trials.clear();
	});
}
