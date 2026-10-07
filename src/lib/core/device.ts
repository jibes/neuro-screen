/** True on devices whose primary input is touch (phones, tablets). Safe to call during SSR. */
export function isTouchDevice(): boolean {
	if (typeof window === 'undefined') return false;
	return window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
}
