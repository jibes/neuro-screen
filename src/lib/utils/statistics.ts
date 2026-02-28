/** Calculate arithmetic mean */
export function mean(values: number[]): number {
	if (values.length === 0) return 0;
	return values.reduce((a, b) => a + b, 0) / values.length;
}

/** Calculate median */
export function median(values: number[]): number {
	if (values.length === 0) return 0;
	const sorted = [...values].sort((a, b) => a - b);
	const mid = Math.floor(sorted.length / 2);
	return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** Calculate standard deviation (sample) */
export function sd(values: number[]): number {
	if (values.length < 2) return 0;
	const m = mean(values);
	const squaredDiffs = values.map((v) => (v - m) ** 2);
	return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / (values.length - 1));
}

/**
 * Calculate d-prime (signal detection sensitivity).
 * Uses log-linear correction for rates of 0 or 1.
 */
export function dPrime(hits: number, totalSignal: number, falseAlarms: number, totalNoise: number): number {
	// Log-linear correction (Hautus, 1995)
	const hitRate = (hits + 0.5) / (totalSignal + 1);
	const faRate = (falseAlarms + 0.5) / (totalNoise + 1);
	return zScore(hitRate) - zScore(faRate);
}

/**
 * Calculate response bias (criterion c).
 */
export function responseBias(hits: number, totalSignal: number, falseAlarms: number, totalNoise: number): number {
	const hitRate = (hits + 0.5) / (totalSignal + 1);
	const faRate = (falseAlarms + 0.5) / (totalNoise + 1);
	return -0.5 * (zScore(hitRate) + zScore(faRate));
}

/** Approximate inverse normal (z-score) using rational approximation */
function zScore(p: number): number {
	// Beasley-Springer-Moro algorithm
	const a = [
		-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2,
		1.383577518672690e2, -3.066479806614716e1, 2.506628277459239e0
	];
	const b = [
		-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2,
		6.680131188771972e1, -1.328068155288572e1
	];
	const c = [
		-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838e0,
		-2.549732539343734e0, 4.374664141464968e0, 2.938163982698783e0
	];
	const d = [
		7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996e0,
		3.754408661907416e0
	];

	const pLow = 0.02425;
	const pHigh = 1 - pLow;

	let q: number, r: number;

	if (p < pLow) {
		q = Math.sqrt(-2 * Math.log(p));
		return (
			(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
			((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
		);
	} else if (p <= pHigh) {
		q = p - 0.5;
		r = q * q;
		return (
			((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) /
			(((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
		);
	} else {
		q = Math.sqrt(-2 * Math.log(1 - p));
		return -(
			(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
			((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
		);
	}
}
