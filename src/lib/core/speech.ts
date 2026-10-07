/** Web Speech API helpers for auditory stimulus presentation (German voice). */

/** Resolve a German voice, waiting briefly for the voice list to load; null if unavailable */
export async function getGermanVoice(timeoutMs = 1500): Promise<SpeechSynthesisVoice | null> {
	if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
	const pick = () => {
		const voices = window.speechSynthesis.getVoices();
		return voices.find((v) => v.lang === 'de-DE' && v.localService) ?? voices.find((v) => v.lang.startsWith('de')) ?? null;
	};
	const immediate = pick();
	if (immediate) return immediate;
	return new Promise((resolve) => {
		const done = () => {
			clearTimeout(timer);
			window.speechSynthesis.removeEventListener('voiceschanged', done);
			resolve(pick());
		};
		const timer = setTimeout(done, timeoutMs);
		window.speechSynthesis.addEventListener('voiceschanged', done);
	});
}

/** Speak `text` (cancels anything still speaking so the presentation rate stays fixed) */
export function speak(text: string, voice: SpeechSynthesisVoice): void {
	window.speechSynthesis.cancel();
	const utterance = new SpeechSynthesisUtterance(text);
	utterance.voice = voice;
	utterance.lang = voice.lang;
	utterance.rate = 1.1;
	window.speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
	if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
}
