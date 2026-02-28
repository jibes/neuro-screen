import { estimateRefreshRate, measureTimerResolution } from './timing.js';

export interface EnvironmentInfo {
	userAgent: string;
	screenWidth: number;
	screenHeight: number;
	devicePixelRatio: number;
	inputDevices: ('keyboard' | 'mouse' | 'touch')[];
	estimatedRefreshRate: number;
	isFullscreen: boolean;
	browserName: string;
	osName: string;
	timerResolutionMs: number;
	webAudioSupported: boolean;
	audioLatencyMs: number | null;
}

export interface EnvironmentCheck {
	label: string;
	status: 'ok' | 'warning' | 'error';
	value: string;
	detail?: string;
}

function detectBrowser(): string {
	const ua = navigator.userAgent;
	if (ua.includes('Firefox')) return 'Firefox';
	if (ua.includes('Edg/')) return 'Edge';
	if (ua.includes('Chrome')) return 'Chrome';
	if (ua.includes('Safari')) return 'Safari';
	return 'Unbekannt';
}

function detectOS(): string {
	const ua = navigator.userAgent;
	if (ua.includes('Mac')) return 'macOS';
	if (ua.includes('Windows')) return 'Windows';
	if (ua.includes('Linux')) return 'Linux';
	if (ua.includes('Android')) return 'Android';
	if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
	return 'Unbekannt';
}

function detectInputDevices(): ('keyboard' | 'mouse' | 'touch')[] {
	const devices: ('keyboard' | 'mouse' | 'touch')[] = [];
	// Touch detection
	if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
		devices.push('touch');
	}
	// Mouse detection via media query
	if (window.matchMedia('(pointer: fine)').matches) {
		devices.push('mouse');
	}
	// Keyboard is assumed on desktop
	if (!devices.includes('touch') || window.matchMedia('(min-width: 1024px)').matches) {
		devices.push('keyboard');
	}
	return devices;
}

export async function gatherEnvironmentInfo(): Promise<EnvironmentInfo> {
	const refreshRate = await estimateRefreshRate();
	const timerResolution = measureTimerResolution();

	let webAudioSupported = false;
	let audioLatencyMs: number | null = null;
	try {
		const ctx = new AudioContext();
		webAudioSupported = true;
		audioLatencyMs = ((ctx.baseLatency ?? 0) + ((ctx as AudioContext & { outputLatency?: number }).outputLatency ?? 0)) * 1000;
		await ctx.close();
	} catch {
		webAudioSupported = false;
	}

	return {
		userAgent: navigator.userAgent,
		screenWidth: window.screen.width,
		screenHeight: window.screen.height,
		devicePixelRatio: window.devicePixelRatio,
		inputDevices: detectInputDevices(),
		estimatedRefreshRate: refreshRate,
		isFullscreen: document.fullscreenElement !== null,
		browserName: detectBrowser(),
		osName: detectOS(),
		timerResolutionMs: timerResolution,
		webAudioSupported,
		audioLatencyMs
	};
}

export function evaluateEnvironment(info: EnvironmentInfo): EnvironmentCheck[] {
	const checks: EnvironmentCheck[] = [];

	// Screen resolution
	const minWidth = 1024;
	const minHeight = 768;
	checks.push({
		label: 'Bildschirmaufloesung',
		status: info.screenWidth >= minWidth && info.screenHeight >= minHeight ? 'ok' : 'warning',
		value: `${info.screenWidth} x ${info.screenHeight}`,
		detail: info.screenWidth < minWidth || info.screenHeight < minHeight
			? `Empfohlen: mindestens ${minWidth} x ${minHeight}`
			: undefined
	});

	// Refresh rate
	checks.push({
		label: 'Bildwiederholrate',
		status: info.estimatedRefreshRate >= 55 ? 'ok' : 'warning',
		value: `${info.estimatedRefreshRate} Hz`,
		detail: info.estimatedRefreshRate < 55
			? 'Niedrige Bildwiederholrate kann die Timing-Praezision beeintraechtigen'
			: undefined
	});

	// Timer resolution
	checks.push({
		label: 'Timer-Aufloesung',
		status: info.timerResolutionMs <= 1 ? 'ok' : info.timerResolutionMs <= 5 ? 'warning' : 'error',
		value: `${info.timerResolutionMs.toFixed(3)} ms`,
		detail: info.timerResolutionMs > 1
			? 'Browser-Sicherheitseinstellungen begrenzen die Timer-Praezision'
			: undefined
	});

	// Web Audio
	checks.push({
		label: 'Web Audio API',
		status: info.webAudioSupported ? 'ok' : 'error',
		value: info.webAudioSupported ? 'Verfuegbar' : 'Nicht verfuegbar',
		detail: !info.webAudioSupported
			? 'Auditive Tests sind ohne Web Audio nicht moeglich'
			: info.audioLatencyMs !== null
				? `Latenz: ${info.audioLatencyMs.toFixed(1)} ms`
				: undefined
	});

	// Input devices
	checks.push({
		label: 'Eingabegeraete',
		status: info.inputDevices.includes('keyboard') ? 'ok' : 'warning',
		value: info.inputDevices.join(', '),
		detail: !info.inputDevices.includes('keyboard')
			? 'Einige Tests erfordern eine Tastatur'
			: undefined
	});

	// Browser
	checks.push({
		label: 'Browser',
		status: ['Chrome', 'Edge', 'Firefox'].includes(info.browserName) ? 'ok' : 'warning',
		value: `${info.browserName} auf ${info.osName}`,
		detail: !['Chrome', 'Edge', 'Firefox'].includes(info.browserName)
			? 'Chrome oder Firefox empfohlen fuer beste Timing-Praezision'
			: undefined
	});

	return checks;
}
