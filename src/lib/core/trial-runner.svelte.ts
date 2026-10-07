import { HighResTimer } from './timing.js';
import { ResponseCollector, type ResponseEvent } from './response-collector.js';

export type TrialPhase = 'idle' | 'fixation' | 'stimulus' | 'response' | 'feedback' | 'iti';

export interface TrialConfig<TStimulus> {
	fixationDuration: number;
	/** How long the stimulus stays visible; null = until response (or end of response window) */
	stimulusDuration: number | null;
	/**
	 * Response window after the stimulus is hidden; null = none.
	 * With stimulusDuration = null it is the total time from onset.
	 */
	responseWindow: number | null;
	feedbackDuration: number;
	itiDuration: number | (() => number);
	stimulus: TStimulus;
	validKeys: string[];
	showFeedback: boolean;
	/**
	 * Keep the full stimulus + response window even after a response (fixed stimulus onset
	 * asynchrony, e.g. CPT / N-Back). Default: the trial ends at the first response.
	 */
	fixedDuration?: boolean;
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
 *
 * - Stimulus onset is taken from the animation frame that presents the stimulus.
 * - pause() freezes all timing; a trial interrupted during stimulus/response is discarded
 *   and repeated after resume().
 * - abort() stops immediately; run() then resolves with null.
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
	let runCtrl = new AbortController();
	let trialCtrl: AbortController | null = null;
	let interrupted = false;
	let destroyed = false;

	function linkedController(): AbortController {
		const ctrl = new AbortController();
		const parent = runCtrl.signal;
		if (parent.aborted) ctrl.abort();
		else parent.addEventListener('abort', () => ctrl.abort(), { once: true });
		return ctrl;
	}

	async function runTrial<TStimulus>(
		trial: TrialConfig<TStimulus>
	): Promise<{ response: ResponseEvent | null; stimulusOnset: number } | null> {
		const ctrl = linkedController();
		trialCtrl = ctrl;
		interrupted = false;
		const signal = ctrl.signal;

		currentStimulus = trial.stimulus;
		phase = 'fixation';
		await timer.delay(trial.fixationDuration, signal);
		if (signal.aborted) return null;

		// Stimulus phase: start listening before the frame so no early response is lost
		phase = 'stimulus';
		let response: ResponseEvent | null = null;
		const responseCtrl = new AbortController();
		signal.addEventListener('abort', () => responseCtrl.abort(), { once: true });
		const responsePromise = collector
			.waitForResponse({ validKeys: trial.validKeys, signal: responseCtrl.signal })
			.then((r) => {
				response = r;
				return r;
			});

		const stimulusOnset = await timer.nextFrame();
		if (signal.aborted) return null;

		const total =
			trial.stimulusDuration !== null && trial.responseWindow !== null
				? trial.stimulusDuration + trial.responseWindow
				: (trial.stimulusDuration ?? trial.responseWindow);
		const elapsed = () => timer.now() - stimulusOnset;

		const waitUntil = (ms: number) => {
			const c = new AbortController();
			signal.addEventListener('abort', () => c.abort(), { once: true });
			return { promise: timer.delay(Math.max(0, ms - elapsed()), c.signal), cancel: () => c.abort() };
		};

		// 1) Stimulus visible
		if (trial.stimulusDuration !== null) {
			const w = waitUntil(trial.stimulusDuration);
			if (trial.fixedDuration) {
				await w.promise;
			} else {
				await Promise.race([w.promise, responsePromise]);
				w.cancel();
			}
			if (signal.aborted) return null;
			if (response === null || trial.fixedDuration) phase = 'response';
		}

		// 2) Remaining response window (stimulus hidden, or still visible if stimulusDuration is null)
		if (total === null) {
			if (response === null) await responsePromise;
		} else {
			const w = waitUntil(total);
			if (trial.fixedDuration) {
				await w.promise;
			} else if (response === null) {
				await Promise.race([w.promise, responsePromise]);
			}
			w.cancel();
		}
		responseCtrl.abort();
		if (signal.aborted) return null;

		return { response, stimulusOnset };
	}

	/**
	 * Run a sequence of trials.
	 * @param trials Array of trial configs
	 * @param evaluateResponse Function to determine if a response was correct
	 * @param onTrialComplete Optional callback after each trial
	 * @returns all outcomes, or null if the run was aborted (or the runner destroyed)
	 */
	async function run<TStimulus>(
		trials: TrialConfig<TStimulus>[],
		evaluateResponse: (
			stimulus: TStimulus,
			response: ResponseEvent | null
		) => { correct: boolean; customData?: Record<string, unknown> },
		onTrialComplete?: (outcome: TrialOutcome, index: number) => void
	): Promise<TrialOutcome[] | null> {
		if (destroyed) return null;
		timer.reset();
		runCtrl = new AbortController();
		const runSignal = runCtrl.signal;
		isRunning = true;
		totalTrials = trials.length;
		currentTrial = 0;
		results = [];

		try {
			for (let i = 0; i < trials.length; i++) {
				if (runSignal.aborted) return null;

				currentTrial = i;
				const trial = trials[i];
				const res = await runTrial(trial);
				if (runSignal.aborted) return null;

				if (res === null) {
					// Interrupted by pause: wait, then repeat this trial
					if (interrupted) {
						phase = 'iti';
						await timer.waitForResume(runSignal);
						i--;
						continue;
					}
					return null;
				}

				const { response, stimulusOnset } = res;
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

				if (trial.showFeedback) {
					phase = 'feedback';
					await timer.delay(trial.feedbackDuration, runSignal);
					if (runSignal.aborted) return null;
				}

				phase = 'iti';
				const iti = typeof trial.itiDuration === 'function' ? trial.itiDuration() : trial.itiDuration;
				await timer.delay(iti, runSignal);
				if (runSignal.aborted) return null;

				onTrialComplete?.(outcome, i);
			}
			currentTrial = trials.length;
			return results;
		} finally {
			trialCtrl = null;
			phase = 'idle';
			isRunning = false;
			currentStimulus = null;
		}
	}

	/** Freeze timing. A trial in its stimulus/response phase is discarded and repeated. */
	function pause(): void {
		timer.pause();
		if (trialCtrl && (phase === 'stimulus' || phase === 'response')) {
			interrupted = true;
			trialCtrl.abort();
		}
	}

	function resume(): void {
		timer.resume();
	}

	/** Stop permanently: the current run resolves with null and later runs do nothing. */
	function abort(): void {
		destroyed = true;
		runCtrl.abort();
		collector.destroy();
		timer.resume();
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
		get destroyed() { return destroyed; },
		timer,
		collector,
		run,
		pause,
		resume,
		abort,
		destroy
	};
}

export type TrialRunner = ReturnType<typeof createTrialRunner>;
