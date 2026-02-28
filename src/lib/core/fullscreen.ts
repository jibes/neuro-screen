/** Request fullscreen mode. Returns true if successful. */
export async function requestFullscreen(element?: HTMLElement): Promise<boolean> {
	const el = element ?? document.documentElement;
	try {
		await el.requestFullscreen();
		return true;
	} catch {
		return false;
	}
}

/** Exit fullscreen mode. */
export async function exitFullscreen(): Promise<void> {
	if (document.fullscreenElement) {
		await document.exitFullscreen();
	}
}

/** Check if currently in fullscreen. */
export function isFullscreen(): boolean {
	return document.fullscreenElement !== null;
}
