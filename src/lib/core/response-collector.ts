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
	timeout?: number;
	target?: EventTarget;
}

/**
 * Collects user responses with precise timing using event.timeStamp.
 * All timestamps are relative to the HighResTimer origin.
 */
export class ResponseCollector {
	private timer: HighResTimer;
	private cleanupFns: Array<() => void> = [];

	constructor(timer: HighResTimer) {
		this.timer = timer;
	}

	/**
	 * Wait for a single response matching the criteria.
	 * Returns null if timeout is reached without a response.
	 */
	waitForResponse(options: WaitOptions = {}): Promise<ResponseEvent | null> {
		const { validKeys, allowMouse = false, allowTouch = false, timeout, target = document } = options;

		return new Promise((resolve) => {
			let resolved = false;
			let timeoutId: ReturnType<typeof setTimeout> | undefined;

			const cleanup = () => {
				if (timeoutId !== undefined) clearTimeout(timeoutId);
				target.removeEventListener('keydown', onKey as EventListener);
				if (allowMouse) target.removeEventListener('mousedown', onMouse as EventListener);
				if (allowTouch) target.removeEventListener('touchstart', onTouch as EventListener);
			};

			const finish = (event: ResponseEvent | null) => {
				if (resolved) return;
				resolved = true;
				cleanup();
				resolve(event);
			};

			const onKey = (e: KeyboardEvent) => {
				if (e.repeat) return;
				if (validKeys && !validKeys.includes(e.key)) return;
				e.preventDefault();
				finish({
					type: 'keydown',
					key: e.key,
					timestamp: this.timer.fromEventTimestamp(e.timeStamp)
				});
			};

			const onMouse = (e: MouseEvent) => {
				finish({
					type: 'mousedown',
					timestamp: this.timer.fromEventTimestamp(e.timeStamp),
					coordinates: { x: e.clientX, y: e.clientY }
				});
			};

			const onTouch = (e: TouchEvent) => {
				const touch = e.touches[0];
				finish({
					type: 'touchstart',
					timestamp: this.timer.fromEventTimestamp(e.timeStamp),
					coordinates: touch ? { x: touch.clientX, y: touch.clientY } : undefined
				});
			};

			target.addEventListener('keydown', onKey as EventListener);
			if (allowMouse) target.addEventListener('mousedown', onMouse as EventListener);
			if (allowTouch) target.addEventListener('touchstart', onTouch as EventListener);

			if (timeout !== undefined) {
				timeoutId = setTimeout(() => finish(null), timeout);
			}

			this.cleanupFns.push(cleanup);
		});
	}

	/**
	 * Start collecting all responses continuously, calling the callback for each.
	 * Returns a stop function.
	 */
	startContinuousCollection(
		callback: (event: ResponseEvent) => void,
		options: Omit<WaitOptions, 'timeout'> = {}
	): () => void {
		const { validKeys, allowMouse = false, allowTouch = false, target = document } = options;

		const onKey = (e: KeyboardEvent) => {
			if (e.repeat) return;
			if (validKeys && !validKeys.includes(e.key)) return;
			e.preventDefault();
			callback({
				type: 'keydown',
				key: e.key,
				timestamp: this.timer.fromEventTimestamp(e.timeStamp)
			});
		};

		const onMouse = (e: MouseEvent) => {
			callback({
				type: 'mousedown',
				timestamp: this.timer.fromEventTimestamp(e.timeStamp),
				coordinates: { x: e.clientX, y: e.clientY }
			});
		};

		const onTouch = (e: TouchEvent) => {
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
		};

		this.cleanupFns.push(stop);
		return stop;
	}

	/** Clean up all event listeners */
	destroy(): void {
		for (const fn of this.cleanupFns) {
			fn();
		}
		this.cleanupFns = [];
	}
}
