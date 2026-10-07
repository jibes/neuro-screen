/** Install support: captures the browser's install prompt so the app can offer its own button. */

interface BeforeInstallPromptEvent extends Event {
	prompt(): Promise<void>;
	userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferredPrompt = $state<BeforeInstallPromptEvent | null>(null);
let installed = $state(false);
let isIos = $state(false);

/** Call once on app start (layout onMount) */
export function initPwa(): void {
	installed =
		window.matchMedia('(display-mode: standalone)').matches ||
		(navigator as Navigator & { standalone?: boolean }).standalone === true;
	const ua = navigator.userAgent;
	isIos = /iPhone|iPad|iPod/.test(ua) || (ua.includes('Mac') && navigator.maxTouchPoints > 1);

	window.addEventListener('beforeinstallprompt', (e) => {
		e.preventDefault(); // show our own button instead of the mini-infobar
		deferredPrompt = e as BeforeInstallPromptEvent;
	});
	window.addEventListener('appinstalled', () => {
		installed = true;
		deferredPrompt = null;
	});
}

export async function promptInstall(): Promise<void> {
	if (!deferredPrompt) return;
	const event = deferredPrompt;
	deferredPrompt = null; // a prompt can only be used once
	await event.prompt();
	const { outcome } = await event.userChoice;
	if (outcome === 'accepted') installed = true;
}

export const pwa = {
	/** Browser offers a native install dialog (Chromium browsers) */
	get canPrompt() {
		return deferredPrompt !== null && !installed;
	},
	/** iOS/iPadOS Safari: installation only via Share → "Zum Home-Bildschirm" */
	get needsManualIos() {
		return isIos && !installed;
	},
	get installed() {
		return installed;
	}
};
