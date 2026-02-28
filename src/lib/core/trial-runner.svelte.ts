import { HighResTimer } from './timing.js';
import { ResponseCollector, type ResponseEvent } from './response-collector.js';

export type TrialPhase = 'idle' | 'fixation' | 'stimulus' | 'response' | 'feedback' | 'iti';

export interface TrialConfig<TStimulus> {
	fixationDuration: number;
	stimulusDuration: number | null; // null = until response
	responseWindow: number | null; // null = unlimited
	feedbackDuration: number;
	itiDuration: number | (() => number);
	stimulus: TStimulus;
	validKeys: string[];
	showFeedback: boolean;
}

export interface TrialOutcome {
	correct: boolean;
	rt: number | null;
	responseKey: string | null;
	stimulusOnset: number;
	responseTimestamp: number | null;
	customData?: Record<string, unknown>;
}

export interface TrialRunnerState {
	phase: TrialPhase;
	currentTrial: number;
	totalTrials: number;
	results: TrialOutcome[];
	isRunning: boolean;
	currentStimulus: unknown | null;
	lastOutcome: TrialOutcome | null;
}

/**
 * Creates a reactive trial runner state using Svelte 5 runes.
 * Manages the fixation → stimulus → response → feedback → ITI cycle.
 */
export function createTrialRunner() {
	let phase = $state<TrialPhase>('idle');
	let currentTrial = $state(0);
	let totalTrials = $state(0);
	let results = $state<TrialOutcome[]>([]);
	let isRunning = $state(false);
	let currentStimulus = $state<unknown>(null);
	let lastOutcome = $state<TrialOutcome | null>(null);

	const timer = new HighResTimer();
	const collector = new ResponseCollector(timer);
	let aborted = false;

	/**
	 * Run a sequence of trials.
	 * @param trials Array of trial configs
	 * @param evaluateResponse Function to determine if a response was correct
	 * @param onTrialComplete Optional callback after each trial
	 */
	async function run<TStimulus>(
		trials: TrialConfig<TStimulus>[],
		evaluateResponse: (
			stimulus: TStimulus,
			response: ResponseEvent | null
		) => { correct: boolean; customData?: Record<string, unknown> },
		onTrialComplete?: (outcome: TrialOutcome, index: number) => void
	): Promise<TrialOutcome[]> {
		timer.reset();
		aborted = false;
		isRunning = true;
		totalTrials = trials.length;
		currentTrial = 0;
		results = [];

		for (let i = 0; i < trials.length; i++) {
			if (aborted) break;

			currentTrial = i;
			const trial = trials[i];
			currentStimulus = trial.stimulus;

			// Fixation phase
			phase = 'fixation';
			await timer.delay(trial.fixationDuration);
			if (aborted) break;

			// Stimulus phase — record onset time
			let stimulusOnset = 0;
			phase = 'stimulus';
			stimulusOnset = timer.now();

			// Response collection
			let response: ResponseEvent | null = null;

			if (trial.stimulusDuration !== null && trial.responseWindow !== null) {
				// Fixed stimulus duration, then response window
				const responsePromise = collector.waitForResponse({
					validKeys: trial.validKeys,
					timeout: trial.stimulusDuration + trial.responseWindow
				});
				response = await responsePromise;
			} else if (trial.stimulusDuration !== null) {
				// Fixed stimulus duration, response allowed during stimulus
				response = await collector.waitForResponse({
					validKeys: trial.validKeys,
					timeout: trial.stimulusDuration
				});
			} else if (trial.responseWindow !== null) {
				// Stimulus stays until response or timeout
				response = await collector.waitForResponse({
					validKeys: trial.validKeys,
					timeout: trial.responseWindow
				});
			} else {
				// Wait indefinitely for response
				response = await collector.waitForResponse({
					validKeys: trial.validKeys
				});
			}

			if (aborted) break;

			// Evaluate
			const evaluation = evaluateResponse(trial.stimulus, response);
			const outcome: TrialOutcome = {
				correct: evaluation.correct,
				rt: response ? response.timestamp - stimulusOnset : null,
				responseKey: response?.key ?? null,
				stimulusOnset,
				responseTimestamp: response?.timestamp ?? null,
				customData: evaluation.customData
			};

			lastOutcome = outcome;
			results = [...results, outcome];

			// Feedback phase
			if (trial.showFeedback) {
				phase = 'feedback';
				await timer.delay(trial.feedbackDuration);
				if (aborted) break;
			}

			// Inter-trial interval
			phase = 'iti';
			const iti = typeof trial.itiDuration === 'function' ? trial.itiDuration() : trial.itiDuration;
			await timer.delay(iti);
			if (aborted) break;

			onTrialComplete?.(outcome, i);
		}

		phase = 'idle';
		isRunning = false;
		currentStimulus = null;
		return results;
	}

	function abort(): void {
		aborted = true;
		collector.destroy();
	}

	function destroy(): void {
		abort();
	}

	return {
		get phase() { return phase; },
		get currentTrial() { return currentTrial; },
		get totalTrials() { return totalTrials; },
		get results() { return results; },
		get isRunning() { return isRunning; },
		get currentStimulus() { return currentStimulus; },
		get lastOutcome() { return lastOutcome; },
		timer,
		collector,
		run,
		abort,
		destroy
	};
}

export type TrialRunner = ReturnType<typeof createTrialRunner>;
