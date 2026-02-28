import { createSession, getLatestSession, type NeuroDB } from './database.js';
import type { Session } from './models.js';
import type { EnvironmentInfo } from '../core/environment-check.js';

let currentSession = $state<Session | null>(null);
let initPromise: Promise<Session | null> | null = null;

export function getSession(): Session | null {
	return currentSession;
}

export function startSessionInit(getEnvironment: () => Promise<EnvironmentInfo>): void {
	initPromise = (async () => {
		const session = await resumeSession();
		if (session) return session;
		const env = await getEnvironment();
		return await initSession(env);
	})();
}

export async function waitForSession(): Promise<Session | null> {
	if (currentSession) return currentSession;
	if (initPromise) return await initPromise;
	return null;
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
