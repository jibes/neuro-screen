export type ThemePreference = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'neuroscreen-theme';
const THEME_COLORS = { light: '#f8fafc', dark: '#020617' } as const;

function readPreference(): ThemePreference {
	try {
		const v = localStorage.getItem(STORAGE_KEY);
		if (v === 'light' || v === 'dark' || v === 'system') return v;
	} catch {
		// storage unavailable (private mode etc.)
	}
	return 'system';
}

let preference = $state<ThemePreference>('system');
let systemDark = $state(false);
const resolved = $derived<'light' | 'dark'>(
	preference === 'system' ? (systemDark ? 'dark' : 'light') : preference
);

function apply() {
	const dark = resolved === 'dark';
	document.documentElement.classList.toggle('dark', dark);
	document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[resolved]);
}

/** Call once on app start (the inline script in app.html already set the class to avoid a flash) */
export function initTheme(): void {
	preference = readPreference();
	const mq = window.matchMedia('(prefers-color-scheme: dark)');
	systemDark = mq.matches;
	mq.addEventListener('change', (e) => {
		systemDark = e.matches;
		apply();
	});
	apply();
}

export function setThemePreference(value: ThemePreference): void {
	preference = value;
	try {
		localStorage.setItem(STORAGE_KEY, value);
	} catch {
		// ignore
	}
	apply();
}

export const theme = {
	get preference() {
		return preference;
	},
	get resolved() {
		return resolved;
	}
};
