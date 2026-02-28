export const de = {
	app: {
		title: 'NeuroScreen',
		subtitle: 'Neuropsychologisches Screening-Tool',
		disclaimer:
			'Dieses Tool dient ausschliesslich als Screening-Instrument und ersetzt keine professionelle neuropsychologische Diagnostik. Bei Bedenken wenden Sie sich bitte an eine qualifizierte Fachperson.'
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
		back: 'Zurueck',
		correct: 'Richtig!',
		incorrect: 'Falsch!',
		practiceComplete: 'Uebung abgeschlossen. Der eigentliche Test beginnt jetzt.',
		testComplete: 'Test abgeschlossen!',
		ready: 'Bereit?',
		pressSpace: 'Druecken Sie die Leertaste, um zu beginnen.',
		results: 'Ergebnisse',
		trials: 'Durchgaenge',
		accuracy: 'Genauigkeit',
		reactionTime: 'Reaktionszeit',
		mean: 'Mittelwert',
		median: 'Median',
		sd: 'Standardabweichung',
		errors: 'Fehler',
		overview: 'Uebersicht',
		backToOverview: 'Zurueck zur Uebersicht',
		nextTest: 'Naechster Test',
		exportCSV: 'CSV exportieren',
		exportJSON: 'JSON exportieren',
		deleteAll: 'Alle Daten loeschen',
		ms: 'ms',
		percent: '%',
		session: 'Sitzung',
		notYetCompleted: 'Noch nicht durchgefuehrt',
		practice: 'Uebung',
		test: 'Test'
	},
	categories: {
		attention: 'Aufmerksamkeit & Inhibition',
		workingMemory: 'Arbeitsgedaechtnis',
		processingSpeed: 'Verarbeitungsgeschwindigkeit',
		executive: 'Exekutivfunktionen',
		memory: 'Gedaechtnis'
	},
	tests: {
		goNogo: {
			name: 'Go/No-Go',
			shortDesc: 'Reaktionshemmung und Aufmerksamkeit',
			instructions: [
				'In diesem Test sehen Sie farbige Kreise auf dem Bildschirm.',
				'Wenn ein GRUENER Kreis erscheint, druecken Sie so schnell wie moeglich die LEERTASTE.',
				'Wenn ein ROTER Kreis erscheint, druecken Sie KEINE Taste.',
				'Versuchen Sie, so schnell und genau wie moeglich zu reagieren.'
			]
		},
		flanker: {
			name: 'Flanker',
			shortDesc: 'Selektive Aufmerksamkeit und Interferenzkontrolle',
			instructions: [
				'In diesem Test sehen Sie eine Reihe von Pfeilen.',
				'Reagieren Sie nur auf den MITTLEREN Pfeil und ignorieren Sie die umgebenden Pfeile.',
				'Druecken Sie die LINKE Pfeiltaste, wenn der mittlere Pfeil nach LINKS zeigt.',
				'Druecken Sie die RECHTE Pfeiltaste, wenn der mittlere Pfeil nach RECHTS zeigt.'
			]
		},
		digitSpan: {
			name: 'Zahlenspanne',
			shortDesc: 'Auditives Arbeitsgedaechtnis',
			instructions: [
				'Sie hoeren eine Folge von Zahlen.',
				'Geben Sie die Zahlen anschliessend in der gleichen Reihenfolge ein.',
				'Die Folgen werden schrittweise laenger.',
				'Der Test endet, wenn Sie zwei Folgen gleicher Laenge hintereinander falsch wiedergeben.'
			]
		},
		stroop: {
			name: 'Stroop',
			shortDesc: 'Interferenzkontrolle',
			instructions: [
				'Sie sehen Farbwoerter, die in verschiedenen Farben dargestellt werden.',
				'Reagieren Sie auf die FARBE des Wortes, nicht auf das Wort selbst.',
				'Druecken Sie: D = Rot, F = Blau, J = Gruen, K = Gelb',
				'Versuchen Sie, so schnell und genau wie moeglich zu reagieren.'
			]
		},
		nBack: {
			name: 'N-Back',
			shortDesc: 'Arbeitsgedaechtnis-Aktualisierung',
			instructions: [
				'Sie sehen nacheinander Buchstaben auf dem Bildschirm.',
				'Druecken Sie die LEERTASTE, wenn der aktuelle Buchstabe mit dem Buchstaben vor N Positionen uebereinstimmt.',
				'Druecken Sie KEINE Taste, wenn es keine Uebereinstimmung gibt.'
			]
		},
		cpt: {
			name: 'CPT',
			shortDesc: 'Daueraufmerksamkeit',
			instructions: [
				'Sie sehen nacheinander Buchstaben auf dem Bildschirm.',
				'Druecken Sie die LEERTASTE, wenn der Buchstabe X erscheint.',
				'Reagieren Sie bei keinem anderen Buchstaben.',
				'Der Test dauert mehrere Minuten. Bleiben Sie aufmerksam.'
			]
		},
		corsi: {
			name: 'Corsi-Block',
			shortDesc: 'Visuospatiales Arbeitsgedaechtnis',
			instructions: [
				'Auf dem Bildschirm sind mehrere Bloecke angeordnet.',
				'Einige Bloecke leuchten nacheinander auf.',
				'Klicken Sie die Bloecke anschliessend in der gleichen Reihenfolge an.',
				'Die Sequenzen werden schrittweise laenger.'
			]
		},
		symbolDigit: {
			name: 'Symbol-Digit',
			shortDesc: 'Verarbeitungsgeschwindigkeit',
			instructions: [
				'Am oberen Bildschirmrand sehen Sie eine Zuordnung von Symbolen zu Zahlen.',
				'Darunter erscheinen Symbole. Geben Sie die zugehoerige Zahl ein.',
				'Arbeiten Sie so schnell und genau wie moeglich.',
				'Sie haben 90 Sekunden Zeit.'
			]
		},
		trailMakingA: {
			name: 'Trail Making A',
			shortDesc: 'Verarbeitungsgeschwindigkeit',
			instructions: [
				'Auf dem Bildschirm sind nummerierte Kreise verteilt.',
				'Verbinden Sie die Kreise in aufsteigender Reihenfolge (1-2-3-...) durch Anklicken.',
				'Arbeiten Sie so schnell wie moeglich.'
			]
		},
		trailMakingB: {
			name: 'Trail Making B',
			shortDesc: 'Kognitive Flexibilitaet',
			instructions: [
				'Auf dem Bildschirm sind Kreise mit Zahlen und Buchstaben verteilt.',
				'Verbinden Sie die Kreise in abwechselnder Reihenfolge: 1-A-2-B-3-C-...',
				'Arbeiten Sie so schnell wie moeglich.'
			]
		},
		wcst: {
			name: 'WCST',
			shortDesc: 'Kognitive Flexibilitaet und Regellernen',
			instructions: [
				'Sie sehen vier Karten oben und eine Karte unten.',
				'Ordnen Sie die untere Karte einer der oberen zu (nach Farbe, Form oder Anzahl).',
				'Sie erhalten Rueckmeldung, ob Ihre Zuordnung richtig war.',
				'Die Zuordnungsregel aendert sich im Verlauf des Tests.'
			]
		},
		tower: {
			name: 'Turm von London',
			shortDesc: 'Planung und Problemloesung',
			instructions: [
				'Sie sehen farbige Scheiben auf drei Staeben.',
				'Verschieben Sie die Scheiben per Drag-and-Drop, um den Zielzustand zu erreichen.',
				'Es darf nur eine Scheibe gleichzeitig bewegt werden.',
				'Versuchen Sie, die Aufgabe in moeglichst wenigen Zuegen zu loesen.'
			]
		},
		delayedRecall: {
			name: 'Verzoegerter Abruf',
			shortDesc: 'Langzeitgedaechtnis',
			instructions: [
				'Im Wortlisten-Test haben Sie eine Liste von 15 Woertern gelernt.',
				'Versuchen Sie jetzt, sich an so viele dieser Woerter wie moeglich zu erinnern.',
				'Geben Sie die Woerter ein und druecken Sie Enter.',
				'Klicken Sie auf "Fertig", wenn Sie keine weiteren Woerter mehr erinnern.'
			]
		},
		wordList: {
			name: 'Wortliste',
			shortDesc: 'Verbales Lernen und Gedaechtnis',
			instructions: [
				'Sie hoeren eine Liste von 15 Woertern.',
				'Nach der Praesentation nennen Sie so viele Woerter wie moeglich.',
				'Dieser Vorgang wird 5 Mal wiederholt.',
				'Spaeter wird ein verzoegerter Abruf erfolgen.'
			]
		},
		reyFigure: {
			name: 'Rey-Figur',
			shortDesc: 'Visuokonstruktion und visuelles Gedaechtnis',
			instructions: [
				'Sie sehen eine komplexe geometrische Figur.',
				'Kopieren Sie die Figur moeglichst genau.',
				'Spaeter werden Sie gebeten, die Figur aus dem Gedaechtnis zu zeichnen.'
			]
		}
	},
	environment: {
		title: 'Umgebungscheck',
		description: 'Vor Beginn der Tests wird Ihre Testumgebung ueberprueft.',
		runCheck: 'Umgebung pruefen',
		allGood: 'Ihre Umgebung ist fuer die Tests geeignet.',
		warnings: 'Es gibt Hinweise, die die Testergebnisse beeinflussen koennten.',
		startAnyway: 'Trotzdem starten'
	},
	results: {
		title: 'Ergebnisse',
		noResults: 'Noch keine Tests durchgefuehrt.',
		completedAt: 'Abgeschlossen am',
		duration: 'Dauer',
		hits: 'Treffer',
		misses: 'Auslassungsfehler',
		falseAlarms: 'Falsche Alarme',
		commissionErrors: 'Kommissionsfehler',
		omissionErrors: 'Auslassungsfehler',
		dPrime: "d' (Sensitivitaet)",
		flankerEffect: 'Flanker-Effekt',
		stroopEffect: 'Stroop-Effekt',
		span: 'Spanne',
		forwardSpan: 'Vorwaertsspanne',
		backwardSpan: 'Rueckwaertsspanne'
	}
} as const;

export type Translations = typeof de;
