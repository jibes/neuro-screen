import { createSession, getLatestSession, saveTestRun, db } from './database.js';
import type { Session, TestRun, TrialData } from './models.js';
import { evaluateEnvironment, type EnvironmentInfo } from '../core/environment-check.js';

let currentSession = $state<Session | null>(null);
let initPromise: Promise<Session | null> | null = null;
let environmentGetter: (() => Promise<EnvironmentInfo>) | null = null;

export function getSession(): Session | null {
	return currentSession;
}

export function startSessionInit(getEnvironment: () => Promise<EnvironmentInfo>): void {
	environmentGetter = getEnvironment;
	const promise = (async () => {
		const resumed = await resumeSession();
		if (resumed) {
			// Refresh the environment snapshot (display, browser etc. may have changed)
			getEnvironment()
				.then(async (env) => {
					if (!currentSession || currentSession.id !== resumed.id) return;
					currentSession = { ...currentSession, environment: env };
					await db.sessions.update(resumed.id!, { environment: env });
				})
				.catch((e) => console.error('Umgebungsdaten konnten nicht aktualisiert werden:', e));
			return resumed;
		}
		const env = await getEnvironment();
		return await initSession(env);
	})();
	promise.catch((e) => {
		console.error('Sitzung konnte nicht initialisiert werden:', e);
		if (initPromise === promise) initPromise = null;
	});
	initPromise = promise;
}

export async function waitForSession(): Promise<Session | null> {
	if (currentSession) return currentSession;
	if (!initPromise && environmentGetter) startSessionInit(environmentGetter);
	if (initPromise) return await initPromise;
	return null;
}

/** Forget the current session (e.g. after all data was deleted); a new one is created on demand. */
export function clearSession(): void {
	currentSession = null;
	initPromise = null;
}

export async function initSession(environment: EnvironmentInfo, participantCode?: string): Promise<Session> {
	const session: Omit<Session, 'id'> = {
		startedAt: new Date().toISOString(),
		participantCode,
		environment,
		completedTests: []
	};
	const id = await createSession(session);
	currentSession = { ...session, id };
	return currentSession;
}

export async function resumeSession(): Promise<Session | null> {
	const session = await getLatestSession();
	if (session) {
		currentSession = session;
	}
	return currentSession;
}

export function markTestCompleted(testId: string): void {
	if (currentSession && !currentSession.completedTests.includes(testId)) {
		currentSession = {
			...currentSession,
			completedTests: [...currentSession.completedTests, testId]
		};
	}
}

export function isTestCompleted(testId: string): boolean {
	return currentSession?.completedTests.includes(testId) ?? false;
}

/**
 * Save a completed test run into the current session: attaches the session id and
 * environment warnings, and marks the test as completed.
 * @returns true if saved
 */
export async function saveRunToSession(
	run: Omit<TestRun, 'id' | 'sessionId' | 'environmentWarnings'>,
	trials: Omit<TrialData, 'id' | 'testRunId'>[]
): Promise<boolean> {
	const session = await waitForSession();
	if (!session?.id) return false;
	const environmentWarnings = session.environment
		? evaluateEnvironment(session.environment)
				.filter((c) => c.status !== 'ok')
				.map((c) => `${c.label}: ${c.value}${c.detail ? ` (${c.detail})` : ''}`)
		: [];
	// Record the colour scheme: stimulus contrast differs between light and dark mode
	const displayTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
	await saveTestRun(
		{ ...run, config: { ...run.config, displayTheme }, sessionId: session.id, environmentWarnings },
		trials
	);
	markTestCompleted(run.testId);
	return true;
}
