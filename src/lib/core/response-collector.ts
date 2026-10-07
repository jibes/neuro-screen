import type { HighResTimer } from './timing.js';

export interface ResponseEvent {
	type: 'keydown' | 'mousedown' | 'touchstart';
	key?: string;
	timestamp: number;
	coordinates?: { x: number; y: number };
}

export interface WaitOptions {
	validKeys?: string[];
	allowMouse?: boolean;
	allowTouch?: boolean;
	/** Timeout in ms of active (non-paused) timer time */
	timeout?: number;
	target?: EventTarget;
	/** Resolves the wait with null when aborted */
	signal?: AbortSignal;
}

/** Single characters are matched case-insensitively (Caps Lock / Shift safe). */
function normalizeKey(key: string): string {
	return key.length === 1 ? key.toLowerCase() : key;
}

/**
 * Collects user responses with precise timing using event.timeStamp.
 * All timestamps are relative to the HighResTimer origin. Input is ignored while the timer is paused.
 */
export class ResponseCollector {
	private timer: HighResTimer;
	private cleanupFns = new Set<() => void>();

	constructor(timer: HighResTimer) {
		this.timer = timer;
	}

	private keyMatches(e: KeyboardEvent, validKeys?: string[]): boolean {
		if (e.repeat || this.timer.paused) return false;
		if (!validKeys) return true;
		const key = normalizeKey(e.key);
		return validKeys.some((k) => normalizeKey(k) === key);
	}

	/**
	 * Wait for a single response matching the criteria.
	 * Returns null if the timeout is reached or the signal aborts without a response.
	 */
	waitForResponse(options: WaitOptions = {}): Promise<ResponseEvent | null> {
		const { validKeys, allowMouse = false, allowTouch = false, timeout, target = document, signal } = options;

		return new Promise((resolve) => {
			let resolved = false;
			const timeoutCtrl = new AbortController();

			const cleanup = () => {
				timeoutCtrl.abort();
				target.removeEventListener('keydown', onKey as EventListener);
				if (allowMouse) target.removeEventListener('mousedown', onMouse as EventListener);
				if (allowTouch) target.removeEventListener('touchstart', onTouch as EventListener);
				signal?.removeEventListener('abort', onAbort);
				this.cleanupFns.delete(onAbort);
			};

			const finish = (event: ResponseEvent | null) => {
				if (resolved) return;
				resolved = true;
				cleanup();
				resolve(event);
			};

			const onAbort = () => finish(null);

			const onKey = (e: KeyboardEvent) => {
				if (!this.keyMatches(e, validKeys)) return;
				e.preventDefault();
				finish({
					type: 'keydown',
					key: normalizeKey(e.key),
					timestamp: this.timer.fromEventTimestamp(e.timeStamp)
				});
			};

			const onMouse = (e: MouseEvent) => {
				if (this.timer.paused) return;
				finish({
					type: 'mousedown',
					timestamp: this.timer.fromEventTimestamp(e.timeStamp),
					coordinates: { x: e.clientX, y: e.clientY }
				});
			};

			const onTouch = (e: TouchEvent) => {
				if (this.timer.paused) return;
				const touch = e.touches[0];
				finish({
					type: 'touchstart',
					timestamp: this.timer.fromEventTimestamp(e.timeStamp),
					coordinates: touch ? { x: touch.clientX, y: touch.clientY } : undefined
				});
			};

			if (signal?.aborted) return finish(null);

			target.addEventListener('keydown', onKey as EventListener);
			if (allowMouse) target.addEventListener('mousedown', onMouse as EventListener);
			if (allowTouch) target.addEventListener('touchstart', onTouch as EventListener);
			signal?.addEventListener('abort', onAbort, { once: true });

			if (timeout !== undefined) {
				this.timer.delay(timeout, timeoutCtrl.signal).then(() => {
					if (!timeoutCtrl.signal.aborted) finish(null);
				});
			}

			this.cleanupFns.add(onAbort);
		});
	}

	/**
	 * Start collecting all responses continuously, calling the callback for each.
	 * Returns a stop function.
	 */
	startContinuousCollection(
		callback: (event: ResponseEvent) => void,
		options: Omit<WaitOptions, 'timeout' | 'signal'> = {}
	): () => void {
		const { validKeys, allowMouse = false, allowTouch = false, target = document } = options;

		const onKey = (e: KeyboardEvent) => {
			if (!this.keyMatches(e, validKeys)) return;
			e.preventDefault();
			callback({
				type: 'keydown',
				key: normalizeKey(e.key),
				timestamp: this.timer.fromEventTimestamp(e.timeStamp)
			});
		};

		const onMouse = (e: MouseEvent) => {
			if (this.timer.paused) return;
			callback({
				type: 'mousedown',
				timestamp: this.timer.fromEventTimestamp(e.timeStamp),
				coordinates: { x: e.clientX, y: e.clientY }
			});
		};

		const onTouch = (e: TouchEvent) => {
			if (this.timer.paused) return;
			const touch = e.touches[0];
			callback({
				type: 'touchstart',
				timestamp: this.timer.fromEventTimestamp(e.timeStamp),
				coordinates: touch ? { x: touch.clientX, y: touch.clientY } : undefined
			});
		};

		target.addEventListener('keydown', onKey as EventListener);
		if (allowMouse) target.addEventListener('mousedown', onMouse as EventListener);
		if (allowTouch) target.addEventListener('touchstart', onTouch as EventListener);

		const stop = () => {
			target.removeEventListener('keydown', onKey as EventListener);
			if (allowMouse) target.removeEventListener('mousedown', onMouse as EventListener);
			if (allowTouch) target.removeEventListener('touchstart', onTouch as EventListener);
			this.cleanupFns.delete(stop);
		};

		this.cleanupFns.add(stop);
		return stop;
	}

	/** Remove all listeners; pending waits resolve with null */
	destroy(): void {
		for (const fn of [...this.cleanupFns]) {
			fn();
		}
		this.cleanupFns.clear();
	}
}
