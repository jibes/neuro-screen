import type { TestSummary } from '$lib/db/models.js';

/**
 * Performance-validity / data-quality heuristics. A flag does not invalidate a result, but
 * signals that it should be interpreted with caution (e.g. chance-level responding,
 * many omissions, many anticipations, interruptions).
 */
export function computeQualityFlags(summary: TestSummary, context: { pauses: number; touch: boolean }): string[] {
	const flags: string[] = [];
	const pct = (x: number) => `${Math.round(x * 100)} %`;

	switch (summary.type) {
		case 'go-nogo': {
			if (summary.goTrials > 0 && summary.omissionErrors / summary.goTrials > 0.3)
				flags.push(`Viele Auslassungen (${pct(summary.omissionErrors / summary.goTrials)} der Go-Durchgänge)`);
			if (summary.noGoTrials > 0 && summary.commissionErrors / summary.noGoTrials > 0.75)
				flags.push('Reaktion auf fast alle No-Go-Reize – Instruktion evtl. nicht befolgt');
			if (summary.anticipations > summary.goTrials * 0.1)
				flags.push(`Viele antizipatorische Reaktionen (< 150 ms): ${summary.anticipations}`);
			break;
		}
		case 'flanker': {
			// 2 response options: chance = 50 %
			if (summary.accuracy < 0.6) flags.push(`Genauigkeit nahe Zufallsniveau (${pct(summary.accuracy)}, Zufall 50 %)`);
			if (summary.totalTrials > 0 && summary.misses / summary.totalTrials > 0.2)
				flags.push(`Viele fehlende Antworten (${summary.misses})`);
			if (summary.anticipations > 5) flags.push(`Antizipatorische Reaktionen: ${summary.anticipations}`);
			break;
		}
		case 'stroop': {
			// 4 response options: chance = 25 %
			if (summary.accuracy < 0.5) flags.push(`Niedrige Genauigkeit (${pct(summary.accuracy)}, Zufall 25 %)`);
			const total = summary.congruentTrials + summary.incongruentTrials + summary.neutralTrials;
			if (total > 0 && summary.misses / total > 0.2) flags.push(`Viele fehlende Antworten (${summary.misses})`);
			if (summary.anticipations > 5) flags.push(`Antizipatorische Reaktionen: ${summary.anticipations}`);
			break;
		}
		case 'cpt': {
			if (summary.targetTrials > 0 && summary.omissionErrors / summary.targetTrials > 0.5)
				flags.push(`Mehr als die Hälfte der Zielreize verpasst (${summary.omissionErrors})`);
			if (summary.dPrime < 0.5) flags.push(`Diskriminationsleistung nahe Zufall (d' = ${summary.dPrime.toFixed(2)})`);
			break;
		}
		case 'n-back': {
			if (summary.dPrime < 0.5) flags.push(`Diskriminationsleistung nahe Zufall (d' = ${summary.dPrime.toFixed(2)})`);
			if (summary.hits + summary.falseAlarms === 0) flags.push('Keine einzige Reaktion – Instruktion evtl. nicht verstanden');
			break;
		}
		case 'digit-span':
		case 'corsi': {
			if (summary.forwardSpan === 0) flags.push('Vorwärtsspanne 0 – keine Folge korrekt wiedergegeben');
			break;
		}
		case 'symbol-digit': {
			if (summary.totalAttempted > 0 && summary.totalErrors / summary.totalAttempted > 0.3)
				flags.push(`Hohe Fehlerrate (${pct(summary.totalErrors / summary.totalAttempted)})`);
			break;
		}
		case 'wcst': {
			if (summary.categoriesCompleted === 0 && summary.totalTrials >= 64)
				flags.push('Keine Kategorie erreicht');
			break;
		}
		case 'word-list': {
			if (summary.wordsPerTrial.length > 0 && Math.max(...summary.wordsPerTrial) <= 2)
				flags.push('Sehr geringe Wiedergabe in allen Lerndurchgängen');
			break;
		}
		case 'delayed-recall': {
			if (summary.delayMinutes < 20) flags.push(`Verzögerung nur ${summary.delayMinutes} min (Standard: 20–30 min)`);
			break;
		}
		case 'rey-figure': {
			if (summary.immediateDPrime < 0.5) flags.push(`Sofortige Wiedererkennung nahe Zufall (d' = ${summary.immediateDPrime.toFixed(2)})`);
			break;
		}
	}

	if (context.pauses > 0) flags.push(`Test wurde ${context.pauses}× unterbrochen`);
	if (context.touch) flags.push('Touch-Eingabe: Reaktionszeiten nicht mit Tastatur-Normen vergleichbar');
	return flags;
}
