/**
 * High-resolution timer for precise stimulus onset and reaction time measurement.
 * Uses the Performance API (performance.now()) which provides sub-millisecond precision.
 */
export class HighResTimer {
	private origin: number;

	constructor() {
		this.origin = performance.now();
	}

	/** Current time in ms since timer creation (sub-ms precision) */
	now(): number {
		return performance.now() - this.origin;
	}

	/** Absolute timestamp from performance.now() */
	nowAbsolute(): number {
		return performance.now();
	}

	/**
	 * Present a stimulus synchronized to the next display frame.
	 * Uses double-rAF technique: first rAF applies DOM change, second rAF
	 * captures the timestamp after the frame containing the change has been committed.
	 * Returns the onset timestamp relative to timer origin.
	 */
	presentOnNextFrame(renderFn: () => void): Promise<number> {
		return new Promise((resolve) => {
			requestAnimationFrame(() => {
				renderFn();
				requestAnimationFrame(() => {
					resolve(this.now());
				});
			});
		});
	}

	/**
	 * Delay for a given number of milliseconds.
	 * Uses setTimeout for reliability across all browser states.
	 */
	delay(ms: number): Promise<void> {
		return new Promise((resolve) => {
			setTimeout(resolve, ms);
		});
	}

	/** Reset the timer origin */
	reset(): void {
		this.origin = performance.now();
	}

	/**
	 * Convert an event.timeStamp to timer-relative time.
	 * event.timeStamp uses the same high-res clock as performance.now().
	 */
	fromEventTimestamp(eventTimestamp: number): number {
		return eventTimestamp - this.origin;
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
 */
export function measureTimerResolution(): number {
	const samples: number[] = [];
	for (let i = 0; i < 100; i++) {
		const t1 = performance.now();
		let t2 = t1;
		while (t2 === t1) {
			t2 = performance.now();
		}
		samples.push(t2 - t1);
	}
	samples.sort((a, b) => a - b);
	return samples[Math.floor(samples.length / 2)];
}
