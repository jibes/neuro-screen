/** Web Speech API helpers for auditory stimulus presentation. */

/**
 * Resolve a voice for `lang` (e.g. 'de', 'en'), waiting briefly for the voice list to load;
 * null if unavailable.
 */
export async function getVoice(
  lang: string,
  timeoutMs = 1500,
): Promise<SpeechSynthesisVoice | null> {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const pick = () => {
    const voices = window.speechSynthesis.getVoices();
    const matching = voices.filter((v) => v.lang.toLowerCase().startsWith(lang));
    return matching.find((v) => v.localService) ?? matching[0] ?? null;
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
