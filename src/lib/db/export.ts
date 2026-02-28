import { getTestRuns, getTrials } from './database.js';
import type { TestRun, TrialData } from './models.js';

/** Export all test runs for a session as JSON */
export async function exportSessionJSON(sessionId: number): Promise<string> {
	const testRuns = await getTestRuns(sessionId);
	const data: Array<{ testRun: TestRun; trials: TrialData[] }> = [];

	for (const run of testRuns) {
		const trials = await getTrials(run.id!);
		data.push({ testRun: run, trials });
	}

	return JSON.stringify(data, null, 2);
}

/** Export trial-level data for a test run as CSV */
export function trialsToCSV(trials: TrialData[]): string {
	if (trials.length === 0) return '';

	const headers = [
		'trialNumber',
		'phase',
		'rt',
		'correct',
		'onsetTimestamp',
		'responseTimestamp'
	];

	const rows = trials.map((t) =>
		[
			t.trialNumber,
			t.phase,
			t.rt !== null ? t.rt.toFixed(2) : '',
			t.correct !== null ? (t.correct ? '1' : '0') : '',
			t.onsetTimestamp.toFixed(2),
			t.responseTimestamp !== null ? t.responseTimestamp.toFixed(2) : ''
		].join(',')
	);

	return [headers.join(','), ...rows].join('\n');
}

/** Trigger a file download in the browser */
export function downloadFile(content: string, filename: string, mimeType: string): void {
	const blob = new Blob([content], { type: mimeType });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}
