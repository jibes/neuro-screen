/**
 * Web Audio API wrapper for precise auditory stimulus presentation.
 * Generates tones programmatically for maximum timing control.
 */
export class AudioEngine {
	private context: AudioContext | null = null;
	private buffers: Map<string, AudioBuffer> = new Map();

	async init(): Promise<void> {
		this.context = new AudioContext();
		if (this.context.state === 'suspended') {
			await this.context.resume();
		}
	}

	private ensureContext(): AudioContext {
		if (!this.context) {
			throw new Error('AudioEngine not initialized. Call init() first.');
		}
		return this.context;
	}

	/** Preload an audio file for instant playback */
	async preload(name: string, url: string): Promise<void> {
		const ctx = this.ensureContext();
		const response = await fetch(url);
		const arrayBuffer = await response.arrayBuffer();
		const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
		this.buffers.set(name, audioBuffer);
	}

	/** Play a preloaded audio buffer */
	playBuffer(name: string): void {
		const ctx = this.ensureContext();
		const buffer = this.buffers.get(name);
		if (!buffer) {
			throw new Error(`Audio buffer "${name}" not found. Call preload() first.`);
		}
		const source = ctx.createBufferSource();
		source.buffer = buffer;
		source.connect(ctx.destination);
		source.start(0);
	}

	/**
	 * Generate and play a pure tone.
	 * @param frequency Frequency in Hz (e.g., 440 for A4)
	 * @param duration Duration in seconds
	 * @param type Oscillator waveform type
	 */
	playTone(frequency: number, duration: number, type: OscillatorType = 'sine'): void {
		const ctx = this.ensureContext();
		const oscillator = ctx.createOscillator();
		const gainNode = ctx.createGain();

		oscillator.type = type;
		oscillator.frequency.value = frequency;
		oscillator.connect(gainNode);
		gainNode.connect(ctx.destination);

		// Smooth envelope to avoid clicks
		const now = ctx.currentTime;
		gainNode.gain.setValueAtTime(0, now);
		gainNode.gain.linearRampToValueAtTime(0.5, now + 0.01);
		gainNode.gain.setValueAtTime(0.5, now + duration - 0.01);
		gainNode.gain.linearRampToValueAtTime(0, now + duration);

		oscillator.start(now);
		oscillator.stop(now + duration);
	}

	/** Play a short beep sound (useful for feedback) */
	playBeep(frequency: number = 800, durationMs: number = 100): void {
		this.playTone(frequency, durationMs / 1000);
	}

	/** Play an error/incorrect sound */
	playError(): void {
		this.playTone(200, 0.3, 'sawtooth');
	}

	/** Get audio context base latency in ms (if available) */
	getLatencyMs(): number | null {
		if (!this.context) return null;
		const base = this.context.baseLatency ?? 0;
		const output = (this.context as AudioContext & { outputLatency?: number }).outputLatency ?? 0;
		return (base + output) * 1000;
	}

	destroy(): void {
		if (this.context) {
			this.context.close();
			this.context = null;
		}
		this.buffers.clear();
	}
}
