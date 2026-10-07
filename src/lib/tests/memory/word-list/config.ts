import { t } from '$lib/i18n/index.js';

const i = t();

export const WORD_LIST_CONFIG = {
	testId: 'word-list',
	testName: i.tests.wordList.name,
	instructions: i.tests.wordList.instructions,

	learningTrials: 5,
	wordDisplayDurationMs: 1500,
	interWordIntervalMs: 500,
	recallTimeLimitMs: 60000, // per free-recall phase

	targetWords: [
		'TROMMEL', 'VORHANG', 'GLOCKE', 'KAFFEE', 'SCHULE',
		'ELTERN', 'MOND', 'GARTEN', 'HUT', 'BAUER',
		'NASE', 'FARBE', 'HAUS', 'FLUSS', 'TISCH'
	],

	/** List B (interference list) – also used as foils in the delayed recognition trial */
	interferenceWords: [
		'FENSTER', 'KIRCHE', 'FISCH', 'WOLKE', 'KUCHEN',
		'BRIEF', 'LAMPE', 'STEIN', 'BLUME', 'MESSER',
		'STUHL', 'PFERD', 'TURM', 'RADIO', 'BESEN'
	],

	/** Semantic/phonemic foils for recognition (delayed-recall test) */
	distractorWords: [
		'PAUKE', 'GARDINE', 'KLINGEL', 'MILCH', 'LEHRER',
		'KINDER', 'STERN', 'WIESE', 'MÜTZE', 'HIRTE',
		'MUND', 'SCHATTEN', 'WOHNUNG', 'BACH', 'BANK'
	]
} as const;
