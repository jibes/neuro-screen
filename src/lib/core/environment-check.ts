import type { StoredFlag } from '$lib/db/models.js';
import { num, t } from '$lib/i18n/index.js';
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

export type EnvironmentCheckId = 'screen' | 'refresh' | 'timer' | 'audio' | 'input' | 'browser';

export interface EnvironmentCheck {
  id: EnvironmentCheckId;
  label: string;
  status: 'ok' | 'warning' | 'error';
  value: string;
  detail?: string;
}

function detectBrowser(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Firefox') || ua.includes('FxiOS')) return 'Firefox';
  if (ua.includes('Edg/') || ua.includes('EdgiOS') || ua.includes('EdgA/')) return 'Edge';
  if (ua.includes('OPR/')) return 'Opera';
  if (ua.includes('Chrome') || ua.includes('CriOS')) return 'Chrome';
  if (ua.includes('Safari')) return 'Safari';
  return 'unknown';
}

function detectOS(): string {
  const ua = navigator.userAgent;
  // Order matters: iOS UAs contain "Mac OS X", Android UAs contain "Linux"
  if (/iPhone|iPad|iPod/.test(ua)) return 'iOS';
  // iPadOS 13+ reports a desktop Mac UA but has touch support
  if (ua.includes('Mac') && navigator.maxTouchPoints > 1) return 'iOS';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Mac')) return 'macOS';
  if (ua.includes('CrOS')) return 'ChromeOS';
  if (ua.includes('Linux')) return 'Linux';
  return 'unknown';
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

  let webAudioSupported: boolean;
  let audioLatencyMs: number | null = null;
  try {
    const ctx = new AudioContext();
    webAudioSupported = true;
    audioLatencyMs =
      ((ctx.baseLatency ?? 0) +
        ((ctx as AudioContext & { outputLatency?: number }).outputLatency ?? 0)) *
      1000;
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
    audioLatencyMs,
  };
}

const MIN_WIDTH = 1024;
const MIN_HEIGHT = 768;
const RECOMMENDED_BROWSERS = ['Chrome', 'Edge', 'Firefox'];

/** Raw, language-neutral parameters of a check (stored with each test run) */
function checkParams(id: EnvironmentCheckId, info: EnvironmentInfo): (string | number)[] {
  switch (id) {
    case 'screen':
      return [info.screenWidth, info.screenHeight];
    case 'refresh':
      return [info.estimatedRefreshRate];
    case 'timer':
      return [info.timerResolutionMs];
    case 'audio':
      return [info.webAudioSupported ? 1 : 0, info.audioLatencyMs ?? -1];
    case 'input':
      return [info.inputDevices.join(', ')];
    case 'browser':
      return [info.browserName, info.osName];
  }
}

function status(id: EnvironmentCheckId, info: EnvironmentInfo): EnvironmentCheck['status'] {
  switch (id) {
    case 'screen':
      return info.screenWidth >= MIN_WIDTH && info.screenHeight >= MIN_HEIGHT ? 'ok' : 'warning';
    case 'refresh':
      return info.estimatedRefreshRate >= 55 ? 'ok' : 'warning';
    case 'timer':
      return info.timerResolutionMs <= 1 ? 'ok' : info.timerResolutionMs <= 5 ? 'warning' : 'error';
    case 'audio':
      return info.webAudioSupported ? 'ok' : 'error';
    case 'input':
      return info.inputDevices.includes('keyboard') || info.inputDevices.includes('touch')
        ? 'ok'
        : 'warning';
    case 'browser':
      return RECOMMENDED_BROWSERS.includes(info.browserName) ? 'ok' : 'warning';
  }
}

/** Human-readable check in the active language, rebuilt from the stored raw parameters */
export function describeCheck(
  id: EnvironmentCheckId,
  params: (string | number)[],
  checkStatus: EnvironmentCheck['status'],
): EnvironmentCheck {
  const c = t().environment.checks;
  const unknown = (v: string | number) => (v === 'unknown' ? t().environment.unknown : String(v));
  const ok = checkStatus === 'ok';
  switch (id) {
    case 'screen':
      return {
        id,
        label: c.screen.label,
        status: checkStatus,
        value: `${params[0]} × ${params[1]}`,
        detail: ok ? undefined : c.screen.detail(MIN_WIDTH, MIN_HEIGHT),
      };
    case 'refresh':
      return {
        id,
        label: c.refresh.label,
        status: checkStatus,
        value: `${params[0]} Hz`,
        detail: ok ? undefined : c.refresh.detail,
      };
    case 'timer':
      return {
        id,
        label: c.timer.label,
        status: checkStatus,
        value: `${num(Number(params[0]), 3)} ms`,
        detail: ok ? undefined : c.timer.detail,
      };
    case 'audio': {
      const supported = Number(params[0]) === 1;
      const latency = Number(params[1]);
      return {
        id,
        label: c.audio.label,
        status: checkStatus,
        value: supported ? c.audio.available : c.audio.unavailable,
        detail: !supported
          ? c.audio.detailUnavailable
          : latency >= 0
            ? c.audio.latency(num(latency, 1))
            : undefined,
      };
    }
    case 'input': {
      const devices = String(params[0]);
      return {
        id,
        label: c.input.label,
        status: checkStatus,
        value: devices,
        detail: devices.includes('keyboard')
          ? undefined
          : devices.includes('touch')
            ? c.input.detailTouch
            : c.input.detailNone,
      };
    }
    case 'browser':
      return {
        id,
        label: c.browser.label,
        status: checkStatus,
        value: c.browser.value(unknown(params[0]), unknown(params[1])),
        detail: ok ? undefined : c.browser.detail,
      };
  }
}

const CHECK_IDS: EnvironmentCheckId[] = ['screen', 'refresh', 'timer', 'audio', 'input', 'browser'];

export function evaluateEnvironment(info: EnvironmentInfo): EnvironmentCheck[] {
  return CHECK_IDS.map((id) => describeCheck(id, checkParams(id, info), status(id, info)));
}

/** Non-ok checks as language-neutral flags for storage with a test run */
export function environmentFlags(info: EnvironmentInfo): StoredFlag[] {
  return CHECK_IDS.filter((id) => status(id, info) !== 'ok').map((id) => ({
    code: id,
    params: [...checkParams(id, info), status(id, info)],
  }));
}

/** Render a stored environment flag (plain strings come from older app versions) */
export function renderEnvironmentFlag(flag: StoredFlag | string): string {
  if (typeof flag === 'string') return flag;
  const params = [...(flag.params ?? [])];
  const checkStatus = (params.pop() as EnvironmentCheck['status']) ?? 'warning';
  if (!CHECK_IDS.includes(flag.code as EnvironmentCheckId)) return flag.code;
  const c = describeCheck(flag.code as EnvironmentCheckId, params, checkStatus);
  return `${c.label}: ${c.value}${c.detail ? ` (${c.detail})` : ''}`;
}
