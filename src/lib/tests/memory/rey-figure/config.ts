import { t } from '$lib/i18n/index.js';
import type { ReyElement } from './types.js';

const i = t();

// 18 real elements from the Rey-Osterrieth Complex Figure + 6 distractors
export const REY_ELEMENTS: ReyElement[] = [
	// Real elements (simplified geometric components)
	{ id: 1, label: 'Grosses Rechteck', svgPath: 'M 60 40 L 240 40 L 240 160 L 60 160 Z', isReal: true },
	{ id: 2, label: 'Horizontale Mittellinie', svgPath: 'M 60 100 L 240 100', isReal: true },
	{ id: 3, label: 'Vertikale Mittellinie', svgPath: 'M 150 40 L 150 160', isReal: true },
	{ id: 4, label: 'Diagonale links oben', svgPath: 'M 60 40 L 150 100', isReal: true },
	{ id: 5, label: 'Diagonale rechts oben', svgPath: 'M 240 40 L 150 100', isReal: true },
	{ id: 6, label: 'Kleines Rechteck links', svgPath: 'M 80 70 L 120 70 L 120 100 L 80 100 Z', isReal: true },
	{ id: 7, label: 'Kreis rechts', svgPath: 'M 210 80 A 15 15 0 1 0 210 110 A 15 15 0 1 0 210 80', isReal: true },
	{ id: 8, label: 'Dreieck oben', svgPath: 'M 150 10 L 170 40 L 130 40 Z', isReal: true },
	{ id: 9, label: 'Kreuz links aussen', svgPath: 'M 30 90 L 60 90 M 45 75 L 45 105', isReal: true },
	{ id: 10, label: 'Quadrat links unten', svgPath: 'M 70 130 L 90 130 L 90 150 L 70 150 Z', isReal: true },
	{ id: 11, label: 'Parallele Linien rechts', svgPath: 'M 240 55 L 270 55 M 240 70 L 270 70 M 240 85 L 270 85', isReal: true },
	{ id: 12, label: 'Diagonale links unten', svgPath: 'M 60 160 L 150 100', isReal: true },
	{ id: 13, label: 'Diagonale rechts unten', svgPath: 'M 240 160 L 150 100', isReal: true },
	{ id: 14, label: 'Raute mitte unten', svgPath: 'M 150 120 L 165 140 L 150 160 L 135 140 Z', isReal: true },
	{ id: 15, label: 'Wellenlinien unten', svgPath: 'M 170 140 Q 180 130 190 140 Q 200 150 210 140', isReal: true },
	{ id: 16, label: 'Punkte rechts oben', svgPath: 'M 255 45 L 256 45 M 265 45 L 266 45 M 260 55 L 261 55', isReal: true },
	{ id: 17, label: 'Bogen rechts unten', svgPath: 'M 240 130 Q 270 145 240 160', isReal: true },
	{ id: 18, label: 'Vertikale Linie links', svgPath: 'M 60 160 L 60 190', isReal: true },
	// Distractor elements (not in the original figure)
	{ id: 19, label: 'Stern oben rechts', svgPath: 'M 270 20 L 275 30 L 285 30 L 277 37 L 280 47 L 270 40 L 260 47 L 263 37 L 255 30 L 265 30 Z', isReal: false },
	{ id: 20, label: 'Spirale mitte', svgPath: 'M 150 100 Q 155 95 160 100 Q 165 105 160 110 Q 155 115 150 110 Q 145 105 150 100', isReal: false },
	{ id: 21, label: 'Pfeil nach rechts', svgPath: 'M 100 170 L 130 170 L 130 165 L 145 175 L 130 185 L 130 180 L 100 180 Z', isReal: false },
	{ id: 22, label: 'Doppelkreis links oben', svgPath: 'M 30 40 A 10 10 0 1 0 30 60 A 10 10 0 1 0 30 40 M 30 45 A 5 5 0 1 0 30 55 A 5 5 0 1 0 30 45', isReal: false },
	{ id: 23, label: 'Zickzack unten', svgPath: 'M 170 180 L 180 170 L 190 180 L 200 170 L 210 180', isReal: false },
	{ id: 24, label: 'Halbmond rechts', svgPath: 'M 280 100 A 20 20 0 0 1 280 140 A 12 12 0 0 0 280 100', isReal: false }
];

export const REY_FIGURE_CONFIG = {
	testId: 'rey-figure',
	testName: i.tests.reyFigure.name,
	instructions: [
		'Sie sehen eine komplexe geometrische Figur.',
		'Praeegen Sie sich die Figur genau ein.',
		'Anschliessend werden Ihnen einzelne Elemente gezeigt.',
		'Entscheiden Sie jeweils, ob das Element in der Figur enthalten war.'
	],

	studyTimeMs: 30000,
	elementsTotal: 24,
	realElements: 18,
	distractorElements: 6
} as const;
