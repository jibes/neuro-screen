/**
 * High-resolution, pausable timer for precise stimulus onset and reaction time measurement.
 * Uses the Performance API (performance.now()) which provides sub-millisecond precision.
 * While paused, time does not advance: now(), delay() and event conversion all exclude
 * paused intervals, so pauses never leak into reaction times or test durations.
 */
export class HighResTimer {
	private origin: number;
	private pausedTotal = 0;
	private pausedAt: number | null = null;
	private resumeWaiters: Array<() => void> = [];

	constructor() {
		this.origin = performance.now();
	}

	/** Active (non-paused) time in ms since timer creation/reset (sub-ms precision) */
	now(): number {
		const t = performance.now();
		const currentPause = this.pausedAt !== null ? t - this.pausedAt : 0;
		return t - this.origin - this.pausedTotal - currentPause;
	}

	/** Absolute timestamp from performance.now() */
	nowAbsolute(): number {
		return performance.now();
	}

	get paused(): boolean {
		return this.pausedAt !== null;
	}

	pause(): void {
		if (this.pausedAt === null) this.pausedAt = performance.now();
	}

	resume(): void {
		if (this.pausedAt === null) return;
		this.pausedTotal += performance.now() - this.pausedAt;
		this.pausedAt = null;
		const waiters = this.resumeWaiters;
		this.resumeWaiters = [];
		for (const w of waiters) w();
	}

	/** Resolves immediately if not paused, otherwise once resumed (or aborted). */
	waitForResume(signal?: AbortSignal): Promise<void> {
		if (!this.paused || signal?.aborted) return Promise.resolve();
		return new Promise((resolve) => {
			const done = () => {
				signal?.removeEventListener('abort', done);
				this.resumeWaiters = this.resumeWaiters.filter((w) => w !== done);
				resolve();
			};
			this.resumeWaiters.push(done);
			signal?.addEventListener('abort', done, { once: true });
		});
	}

	/**
	 * Wait for `ms` of active (non-paused) time. Resolves early when `signal` aborts.
	 */
	delay(ms: number, signal?: AbortSignal): Promise<void> {
		const target = this.now() + ms;
		return new Promise((resolve) => {
			if (signal?.aborted) return resolve();
			let timeoutId: ReturnType<typeof setTimeout> | undefined;
			const finish = () => {
				if (timeoutId !== undefined) clearTimeout(timeoutId);
				signal?.removeEventListener('abort', finish);
				resolve();
			};
			const tick = async () => {
				if (signal?.aborted) return finish();
				if (this.paused) {
					await this.waitForResume(signal);
					if (signal?.aborted) return finish();
				}
				const remaining = target - this.now();
				if (remaining <= 0) return finish();
				timeoutId = setTimeout(tick, remaining);
			};
			signal?.addEventListener('abort', finish, { once: true });
			tick();
		});
	}

	/** Reset the timer origin (also clears any pause state) */
	reset(): void {
		this.origin = performance.now();
		this.pausedTotal = 0;
		if (this.pausedAt !== null) {
			this.pausedAt = null;
			const waiters = this.resumeWaiters;
			this.resumeWaiters = [];
			for (const w of waiters) w();
		}
	}

	/**
	 * Convert an event.timeStamp (or rAF timestamp) to timer-relative active time.
	 * Both use the same high-res clock as performance.now().
	 */
	fromEventTimestamp(eventTimestamp: number): number {
		return eventTimestamp - this.origin - this.pausedTotal;
	}

	/**
	 * Resolve with the timer-relative timestamp of the next animation frame, i.e. the frame
	 * in which DOM changes made before this call are presented. Falls back to now() if no
	 * frame arrives within 100 ms (e.g. hidden tab).
	 */
	nextFrame(): Promise<number> {
		return new Promise((resolve) => {
			let settled = false;
			const fallback = setTimeout(() => {
				if (settled) return;
				settled = true;
				resolve(this.now());
			}, 100);
			requestAnimationFrame((ts) => {
				if (settled) return;
				settled = true;
				clearTimeout(fallback);
				resolve(this.fromEventTimestamp(ts));
			});
		});
	}
}

/**
 * Estimate the display refresh rate by measuring frame intervals over ~2 seconds.
 */
export function estimateRefreshRate(): Promise<number> {
	const timestamps: number[] = [];
	return new Promise((resolve) => {
		let count = 0;
		const measure = (timestamp: number) => {
			timestamps.push(timestamp);
			count++;
			if (count < 120) {
				requestAnimationFrame(measure);
			} else {
				const intervals = timestamps.slice(1).map((t, i) => t - timestamps[i]);
				intervals.sort((a, b) => a - b);
				const medianInterval = intervals[Math.floor(intervals.length / 2)];
				resolve(Math.round(1000 / medianInterval));
			}
		};
		requestAnimationFrame(measure);
	});
}

/**
 * Measure the effective resolution of performance.now() on this system.
 * Bounded to ~200 ms of busy-waiting so coarse timers cannot freeze the page.
 */
export function measureTimerResolution(): number {
	const samples: number[] = [];
	const budgetEnd = performance.now() + 200;
	for (let i = 0; i < 100; i++) {
		const t1 = performance.now();
		let t2 = t1;
		while (t2 === t1) {
			t2 = performance.now();
		}
		samples.push(t2 - t1);
		if (t2 > budgetEnd && samples.length >= 3) break;
	}
	samples.sort((a, b) => a - b);
	return samples[Math.floor(samples.length / 2)];
}
