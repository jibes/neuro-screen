export const de = {
	app: {
		title: 'NeuroScreen',
		subtitle: 'Neuropsychologisches Screening-Tool',
		disclaimer:
			'Dieses Tool dient ausschließlich als Screening-Instrument und ersetzt keine professionelle neuropsychologische Diagnostik. Bei Bedenken wenden Sie sich bitte an eine qualifizierte Fachperson.'
	},
	nav: {
		home: 'Startseite',
		tests: 'Tests',
		results: 'Ergebnisse',
		environment: 'Umgebungscheck'
	},
	common: {
		start: 'Starten',
		next: 'Weiter',
		back: 'Zurück',
		correct: 'Richtig!',
		incorrect: 'Falsch!',
		practiceComplete: 'Übung abgeschlossen. Der eigentliche Test beginnt jetzt.',
		testComplete: 'Test abgeschlossen!',
		ready: 'Bereit?',
		pressSpace: 'Drücken Sie die Leertaste, um zu beginnen.',
		results: 'Ergebnisse',
		trials: 'Durchgänge',
		accuracy: 'Genauigkeit',
		reactionTime: 'Reaktionszeit',
		mean: 'Mittelwert',
		median: 'Median',
		sd: 'Standardabweichung',
		errors: 'Fehler',
		overview: 'Übersicht',
		backToOverview: 'Zurück zur Übersicht',
		nextTest: 'Nächster Test',
		exportCSV: 'CSV exportieren',
		exportJSON: 'JSON exportieren',
		deleteAll: 'Alle Daten löschen',
		ms: 'ms',
		percent: '%',
		session: 'Sitzung',
		notYetCompleted: 'Noch nicht durchgeführt',
		practice: 'Übung',
		test: 'Test'
	},
	touch: {
		singleButton:
			'Auf Touch-Geräten: Tippen Sie statt der Leertaste auf die große Schaltfläche am unteren Bildschirmrand.',
		arrows:
			'Auf Touch-Geräten: Tippen Sie statt der Pfeiltasten auf die Schaltflächen links/rechts am unteren Bildschirmrand.',
		colors:
			'Auf Touch-Geräten: Tippen Sie statt der Tasten D/F/J/K auf die Farbschaltflächen am unteren Bildschirmrand.',
		keypad: 'Auf Touch-Geräten: Verwenden Sie das Ziffernfeld auf dem Bildschirm.',
		tap: 'Tippen'
	},
	categories: {
		attention: 'Aufmerksamkeit & Inhibition',
		workingMemory: 'Arbeitsgedächtnis',
		processingSpeed: 'Verarbeitungsgeschwindigkeit',
		executive: 'Exekutivfunktionen',
		memory: 'Gedächtnis'
	},
	tests: {
		goNogo: {
			name: 'Go/No-Go',
			shortDesc: 'Reaktionshemmung und Aufmerksamkeit',
			instructions: [
				'In diesem Test sehen Sie farbige Kreise auf dem Bildschirm.',
				'Wenn ein GRÜNER Kreis erscheint, drücken Sie so schnell wie möglich die LEERTASTE.',
				'Wenn ein ROTER Kreis erscheint, drücken Sie KEINE Taste.',
				'Versuchen Sie, so schnell und genau wie möglich zu reagieren.'
			]
		},
		flanker: {
			name: 'Flanker',
			shortDesc: 'Selektive Aufmerksamkeit und Interferenzkontrolle',
			instructions: [
				'In diesem Test sehen Sie eine Reihe von Pfeilen.',
				'Reagieren Sie nur auf den MITTLEREN Pfeil und ignorieren Sie die umgebenden Pfeile.',
				'Drücken Sie die LINKE Pfeiltaste, wenn der mittlere Pfeil nach LINKS zeigt.',
				'Drücken Sie die RECHTE Pfeiltaste, wenn der mittlere Pfeil nach RECHTS zeigt.'
			]
		},
		digitSpan: {
			name: 'Zahlenspanne',
			shortDesc: 'Verbales Arbeitsgedächtnis (vorwärts und rückwärts)',
			instructions: [
				'Sie hören nacheinander einzelne Zahlen (falls keine Sprachausgabe verfügbar ist, werden sie angezeigt). Bitte schalten Sie den Ton ein.',
				'Teil 1 – vorwärts: Geben Sie die Zahlen anschließend in der GLEICHEN Reihenfolge ein und bestätigen Sie mit Enter.',
				'Teil 2 – rückwärts: Geben Sie die Zahlen in UMGEKEHRTER Reihenfolge ein. Vor jedem Teil gibt es Übungsdurchgänge.',
				'Die Folgen werden schrittweise länger. Ein Teil endet, wenn beide Folgen einer Länge falsch wiedergegeben werden.'
			]
		},
		stroop: {
			name: 'Stroop',
			shortDesc: 'Interferenzkontrolle',
			instructions: [
				'Sie sehen Farbwörter, die in verschiedenen Farben dargestellt werden.',
				'Reagieren Sie auf die FARBE des Wortes, nicht auf das Wort selbst.',
				'Drücken Sie: D = Rot, F = Blau, J = Grün, K = Gelb',
				'Versuchen Sie, so schnell und genau wie möglich zu reagieren.'
			]
		},
		nBack: {
			name: 'N-Back',
			shortDesc: 'Arbeitsgedächtnis-Aktualisierung',
			instructions: [
				'Sie sehen nacheinander Buchstaben auf dem Bildschirm.',
				'Drücken Sie die LEERTASTE, wenn der aktuelle Buchstabe mit dem Buchstaben von vor 2 Positionen übereinstimmt (2-Back).',
				'Drücken Sie KEINE Taste, wenn es keine Übereinstimmung gibt.'
			]
		},
		cpt: {
			name: 'CPT',
			shortDesc: 'Daueraufmerksamkeit',
			instructions: [
				'Sie sehen nacheinander Buchstaben auf dem Bildschirm.',
				'Drücken Sie die LEERTASTE, wenn der Buchstabe X erscheint.',
				'Reagieren Sie bei keinem anderen Buchstaben.',
				'Der Test dauert mehrere Minuten. Bleiben Sie aufmerksam.'
			]
		},
		corsi: {
			name: 'Corsi-Block',
			shortDesc: 'Visuell-räumliches Arbeitsgedächtnis (vorwärts und rückwärts)',
			instructions: [
				'Auf dem Bildschirm sind neun Blöcke angeordnet. Einige leuchten nacheinander auf.',
				'Teil 1 – vorwärts: Klicken Sie die Blöcke anschließend in der GLEICHEN Reihenfolge an.',
				'Teil 2 – rückwärts: Klicken Sie die Blöcke in UMGEKEHRTER Reihenfolge an. Vor jedem Teil gibt es Übungsdurchgänge.',
				'Die Folgen werden schrittweise länger. Ein Teil endet, wenn beide Folgen einer Länge falsch sind.'
			]
		},
		symbolDigit: {
			name: 'Symbol-Digit',
			shortDesc: 'Verarbeitungsgeschwindigkeit',
			instructions: [
				'Am oberen Bildschirmrand sehen Sie eine Zuordnung von Symbolen zu Zahlen.',
				'Darunter erscheinen Symbole. Geben Sie die zugehörige Zahl ein.',
				'Zuerst bearbeiten Sie 10 Übungsaufgaben ohne Zeitlimit.',
				'Danach haben Sie 90 Sekunden Zeit. Arbeiten Sie so schnell und genau wie möglich.'
			]
		},
		trailMakingA: {
			name: 'Trail Making A',
			shortDesc: 'Verarbeitungsgeschwindigkeit',
			instructions: [
				'Auf dem Bildschirm sind nummerierte Kreise verteilt.',
				'Verbinden Sie die Kreise in aufsteigender Reihenfolge (1-2-3-...) durch Anklicken.',
				'Arbeiten Sie so schnell wie möglich.'
			]
		},
		trailMakingB: {
			name: 'Trail Making B',
			shortDesc: 'Kognitive Flexibilität',
			instructions: [
				'Auf dem Bildschirm sind Kreise mit Zahlen und Buchstaben verteilt.',
				'Verbinden Sie die Kreise in abwechselnder Reihenfolge: 1-A-2-B-3-C-...',
				'Arbeiten Sie so schnell wie möglich.'
			]
		},
		wcst: {
			name: 'WCST',
			shortDesc: 'Kognitive Flexibilität und Regellernen',
			instructions: [
				'Sie sehen vier Karten oben und eine Karte unten.',
				'Ordnen Sie die untere Karte einer der oberen zu (nach Farbe, Form oder Anzahl).',
				'Sie erhalten Rückmeldung, ob Ihre Zuordnung richtig war.',
				'Die Zuordnungsregel ändert sich im Verlauf des Tests.'
			]
		},
		tower: {
			name: 'Turm von London',
			shortDesc: 'Planung und Problemlösung',
			instructions: [
				'Sie sehen farbige Scheiben auf drei Stäben.',
				'Klicken Sie zuerst auf einen Stab, um die oberste Scheibe auszuwählen, und dann auf den Zielstab.',
				'Es darf nur eine Scheibe gleichzeitig bewegt werden.',
				'Versuchen Sie, die Aufgabe in möglichst wenigen Zügen zu lösen.'
			]
		},
		delayedRecall: {
			name: 'Verzögerter Abruf',
			shortDesc: 'Langzeitgedächtnis: Abruf und Wiedererkennen',
			instructions: [
				'Im Wortlisten-Test haben Sie eine Liste von 15 Wörtern gelernt (die erste, mehrfach dargebotene Liste).',
				'Teil 1: Geben Sie so viele Wörter dieser ersten Liste ein, wie Sie sich erinnern. Klicken Sie auf „Fertig“, wenn Ihnen keine weiteren einfallen.',
				'Teil 2: Danach sehen Sie einzelne Wörter. Entscheiden Sie jeweils, ob das Wort in der ERSTEN Liste vorkam.'
			]
		},
		wordList: {
			name: 'Wortliste',
			shortDesc: 'Verbales Lernen und Gedächtnis (RAVLT-ähnlich)',
			instructions: [
				'Sie hören eine Liste von 15 Wörtern (ohne Sprachausgabe werden sie angezeigt). Bitte schalten Sie den Ton ein.',
				'Geben Sie danach so viele Wörter wie möglich ein – die Reihenfolge ist egal. Die Liste wird insgesamt 5-mal dargeboten.',
				'Danach folgt einmalig eine zweite Liste und anschließend ein erneuter Abruf der ersten Liste.',
				'Führen Sie 20–30 Minuten später den Test „Verzögerter Abruf“ durch (bis dahin gern andere, nicht-sprachliche Tests).'
			]
		},
		reyFigure: {
			name: 'Figurengedächtnis',
			shortDesc: 'Visuelles Gedächtnis (Wiedererkennung)',
			instructions: [
				'Sie sehen 30 Sekunden lang eine komplexe geometrische Figur. Prägen Sie sich die Figur genau ein.',
				'Anschließend werden Ihnen einzelne Elemente gezeigt. Entscheiden Sie jeweils, ob das Element in der Figur enthalten war.',
				'Nach einer kurzen Pause folgen weitere Elemente, ebenfalls aus dem Gedächtnis zu beurteilen.'
			]
		}
	},
	environment: {
		title: 'Umgebungscheck',
		description: 'Vor Beginn der Tests wird Ihre Testumgebung überprüft.',
		runCheck: 'Umgebung prüfen',
		allGood: 'Ihre Umgebung ist für die Tests geeignet.',
		warnings: 'Es gibt Hinweise, die die Testergebnisse beeinflussen könnten.',
		startAnyway: 'Trotzdem starten'
	},
	results: {
		title: 'Ergebnisse',
		noResults: 'Noch keine Tests durchgeführt.',
		completedAt: 'Abgeschlossen am',
		duration: 'Dauer',
		hits: 'Treffer',
		misses: 'Auslassungsfehler',
		falseAlarms: 'Falsche Alarme',
		commissionErrors: 'Kommissionsfehler',
		omissionErrors: 'Auslassungsfehler',
		dPrime: "d' (Sensitivität)",
		flankerEffect: 'Flanker-Effekt',
		stroopEffect: 'Stroop-Effekt',
		span: 'Spanne',
		forwardSpan: 'Vorwärtsspanne',
		backwardSpan: 'Rückwärtsspanne'
	}
} as const;

export type Translations = typeof de;
