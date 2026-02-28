/** Standard fixation cross duration in ms */
export const DEFAULT_FIXATION_DURATION = 500;

/** Default inter-trial interval base in ms */
export const DEFAULT_ITI_BASE = 1000;

/** Default ITI jitter range in ms (+/- half this value) */
export const DEFAULT_ITI_JITTER = 400;

/** Default feedback display duration in ms */
export const DEFAULT_FEEDBACK_DURATION = 500;

/** Default response window in ms */
export const DEFAULT_RESPONSE_WINDOW = 1500;

/** Default practice accuracy threshold (proportion) */
export const DEFAULT_PRACTICE_THRESHOLD = 0.6;

/** Countdown duration before test start in seconds */
export const COUNTDOWN_SECONDS = 3;

/** Generate a jittered ISI */
export function jitteredISI(base: number = DEFAULT_ITI_BASE, jitter: number = DEFAULT_ITI_JITTER): number {
	return base + (Math.random() - 0.5) * jitter;
}
