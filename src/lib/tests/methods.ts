/**
 * Methodological documentation per test: paradigm, procedure, measures, deviations from the
 * original instrument and references. Rendered on /methodik.
 */
export interface TestMethod {
	id: string;
	paradigm: string;
	procedure: string;
	measures: string[];
	deviations: string[];
	references: string[];
}

export const GENERAL_REFERENCES = [
	'Anwyl-Irvine, A., Dalmaijer, E. S., Hodges, N., & Evershed, J. K. (2021). Realistic precision and accuracy of online experiment platforms, web browsers, and devices. Behavior Research Methods, 53, 1407–1425.',
	'Bridges, D., Pitiot, A., MacAskill, M. R., & Peirce, J. W. (2020). The timing mega-study: comparing a range of experiment generators, both lab-based and online. PeerJ, 8, e9414.',
	'Ratcliff, R. (1993). Methods for dealing with reaction time outliers. Psychological Bulletin, 114, 510–532.',
	'Hautus, M. J. (1995). Corrections for extreme proportions and their biasing effects on estimated values of d′. Behavior Research Methods, Instruments, & Computers, 27, 46–51.',
	'Stanislaw, H., & Todorov, N. (1999). Calculation of signal detection theory measures. Behavior Research Methods, Instruments, & Computers, 31, 137–149.'
];

export const TEST_METHODS: TestMethod[] = [
	{
		id: 'go-nogo',
		paradigm: 'Go/No-Go-Aufgabe zur Reaktionshemmung.',
		procedure:
			'60 Durchgänge (75 % Go, 25 % No-Go; max. 2 No-Go in Folge), Fixation 500 ms, Reiz 500 ms, Antwortfenster 1500 ms ab Reizbeginn, ITI 800–1200 ms. Übungsblock (10 Durchgänge, Rückmeldung, ≥ 60 % korrekt).',
		measures: [
			'Kommissionsfehler (Reaktion auf No-Go) als Maß der Inhibition',
			'Auslassungen, Treffer-RT (M, Md, SD) nach Bereinigung',
			"d′ und Antworttendenz c (Signalentdeckung, log-lineare Korrektur)"
		],
		deviations: ['Farbige Kreise statt Buchstaben/Formen; keine Normdaten.'],
		references: [
			'Bezdjian, S., Baker, L. A., Lozano, D. I., & Raine, A. (2009). Assessing inattention and impulsivity in children during the Go/NoGo task. British Journal of Developmental Psychology, 27, 365–383.'
		]
	},
	{
		id: 'flanker',
		paradigm: 'Eriksen-Flanker-Aufgabe (Pfeilversion) zur Interferenzkontrolle.',
		procedure:
			'80 Durchgänge (50 % kongruent, 50 % inkongruent, Zielrichtung balanciert; max. 3 gleiche Bedingungen bzw. Antworten in Folge), Antwort mit Pfeiltasten, Antwortfenster 1500 ms. Übungsblock mit Rückmeldung.',
		measures: [
			'Flanker-Effekt = RT inkongruent − RT kongruent (korrekte Durchgänge; Mittelwert und Median)',
			'Fehler je Bedingung, fehlende Antworten'
		],
		deviations: ['Keine neutrale Bedingung; keine Normdaten.'],
		references: [
			'Eriksen, B. A., & Eriksen, C. W. (1974). Effects of noise letters upon the identification of a target letter in a nonsearch task. Perception & Psychophysics, 16, 143–149.',
			'Fan, J., McCandliss, B. D., Sommer, T., Raz, A., & Posner, M. I. (2002). Testing the efficiency and independence of attentional networks. Journal of Cognitive Neuroscience, 14, 340–347.'
		]
	},
	{
		id: 'stroop',
		paradigm: 'Farb-Wort-Interferenz (Stroop), computerisierte Einzeldurchgangsversion.',
		procedure:
			'108 Durchgänge (je 36 kongruent, inkongruent, neutral „XXXX“; Farben und Farb-Wort-Paarungen vollständig balanciert). Keine Wiederholung der Schriftfarbe in aufeinanderfolgenden Durchgängen und kein Wort, das die vorherige Schriftfarbe benennt (Kontrolle von Antwort-Priming und negativem Priming); max. 3 gleiche Bedingungen in Folge. Antwort per Taste (D/F/J/K).',
		measures: [
			'Stroop-Effekt (inkongruent − kongruent), Interferenz (inkongruent − neutral), Fazilitation (neutral − kongruent)',
			'Mittelwerte und Mediane korrekter Durchgänge; Fehler je Bedingung'
		],
		deviations: [
			'Tastenantwort statt Benennen der Farbe (manuelle Stroop-Effekte sind kleiner als vokale).',
			'Keine Normdaten.'
		],
		references: [
			'Stroop, J. R. (1935). Studies of interference in serial verbal reactions. Journal of Experimental Psychology, 18, 643–662.',
			'MacLeod, C. M. (1991). Half a century of research on the Stroop effect: An integrative review. Psychological Bulletin, 109, 163–203.',
			'Tipper, S. P. (1985). The negative priming effect: Inhibitory priming by ignored objects. Quarterly Journal of Experimental Psychology, 37A, 571–590.'
		]
	},
	{
		id: 'cpt',
		paradigm: 'Continuous Performance Test (CPT-X) zur Daueraufmerksamkeit.',
		procedure:
			'200 Buchstaben in 4 Blöcken à 50 (je Block gleich viele Zielreize „X“, 20 %), Darbietung 250 ms, feste Reizfolge (SOA ≈ 2 s unabhängig von der Antwort).',
		measures: [
			'Auslassungen, Kommissionen, d′, c',
			'Treffer-RT, intraindividuelle Variabilität (CV)',
			'Leistungsverlauf über die Blöcke (Vigilanzabfall): RT, Auslassungen und Kommissionen je Block'
		],
		deviations: ['Kürzer als klinische CPTs (z. B. Conners CPT 14 min); keine Normdaten.'],
		references: [
			'Rosvold, H. E., Mirsky, A. F., Sarason, I., Bransome, E. D., & Beck, L. H. (1956). A continuous performance test of brain damage. Journal of Consulting Psychology, 20, 343–350.'
		]
	},
	{
		id: 'n-back',
		paradigm: 'Verbale 2-Back-Aufgabe zur Aktualisierung des Arbeitsgedächtnisses.',
		procedure: '60 Konsonanten, 30 % Zielreize, Darbietung 500 ms, feste Reizfolge (SOA ≈ 3 s). Übungsblock mit Rückmeldung.',
		measures: ['Treffer, falsche Alarme, d′', 'Treffer-RT (M, Md)'],
		deviations: ['Nur eine Stufe (2-Back); keine Kontrolle von Köder-Durchgängen (Lures); keine Normdaten.'],
		references: [
			'Kirchner, W. K. (1958). Age differences in short-term retention of rapidly changing information. Journal of Experimental Psychology, 55, 352–358.',
			'Owen, A. M., McMillan, K. M., Laird, A. R., & Bullmore, E. (2005). N-back working memory paradigm: A meta-analysis of normative functional neuroimaging studies. Human Brain Mapping, 25, 46–59.'
		]
	},
	{
		id: 'digit-span',
		paradigm: 'Zahlenspanne vorwärts und rückwärts (verbales Kurzzeit- bzw. Arbeitsgedächtnis).',
		procedure:
			'Vorgehen nach WAIS-IV: je 2 Durchgänge pro Länge (vorwärts 2–9, rückwärts 2–8), Abbruch, wenn beide Durchgänge einer Länge falsch sind, 1 Ziffer pro Sekunde, gesprochene Darbietung (Sprachsynthese), keine Rückmeldung im Test. Übungsdurchgänge vor beiden Teilen.',
		measures: ['Längste korrekte Spanne vorwärts/rückwärts', 'Rohwert = Anzahl korrekter Durchgänge je Richtung'],
		deviations: [
			'Eigene Zufallsfolgen statt der WAIS-Itemfolgen; synthetische Stimme; Eingabe per Tastatur statt mündlich.',
			'Ohne Sprachausgabe visuelle Darbietung (wird gespeichert).',
			'Keine Normdaten; WAIS-Normen nicht übertragbar.'
		],
		references: ['Wechsler, D. (2008). Wechsler Adult Intelligence Scale – Fourth Edition. Pearson.']
	},
	{
		id: 'corsi',
		paradigm: 'Corsi-Block-Tapping (visuell-räumliches Arbeitsgedächtnis), vorwärts und rückwärts.',
		procedure:
			'9 Blöcke, Sequenzen ohne Wiederholung, 1 Block pro Sekunde, je 2 Durchgänge pro Länge ab 2, Abbruch nach 2 Fehlern einer Länge, keine Rückmeldung im Test. Übungsdurchgänge vor beiden Teilen.',
		measures: ['Blockspanne vorwärts/rückwärts', 'Gesamtscore = Spanne × korrekte Folgen (Kessels et al., 2000)'],
		deviations: ['Eigene Blockanordnung statt der Originalkoordinaten; Bildschirm statt Holzbrett; keine Normdaten.'],
		references: [
			'Corsi, P. M. (1972). Human memory and the medial temporal region of the brain. Dissertation, McGill University.',
			'Kessels, R. P. C., van Zandvoort, M. J. E., Postma, A., Kappelle, L. J., & de Haan, E. H. F. (2000). The Corsi Block-Tapping Task: Standardization and normative data. Applied Neuropsychology, 7, 252–258.'
		]
	},
	{
		id: 'symbol-digit',
		paradigm: 'Symbol-Zahlen-Zuordnung (angelehnt an SDMT/DSST) zur Verarbeitungsgeschwindigkeit.',
		procedure: '10 ungezeitete Übungsitems mit Rückmeldung, danach 90 s; feste Zuordnung von 9 Symbolen zu den Ziffern 1–9.',
		measures: ['Anzahl korrekter Zuordnungen in 90 s', 'Fehler, Bearbeitungsrate'],
		deviations: ['Eigene Symbole; Tastatur/Ziffernfeld statt schriftlicher oder mündlicher Antwort; keine Normdaten.'],
		references: [
			'Smith, A. (1982). Symbol Digit Modalities Test: Manual. Western Psychological Services.',
			'Benedict, R. H. B., et al. (2017). Validity of the Symbol Digit Modalities Test as a cognition performance outcome measure for multiple sclerosis. Multiple Sclerosis Journal, 23, 721–733.'
		]
	},
	{
		id: 'trail-making-a',
		paradigm: 'Trail Making Test, Teil A (visuelle Suche, psychomotorisches Tempo).',
		procedure: 'Übungsbeispiel mit 8 Kreisen, danach 25 Kreise (1–25) per Klick/Tipp verbinden; Fehler werden sofort angezeigt.',
		measures: ['Bearbeitungszeit', 'Fehler', 'Segmentzeiten'],
		deviations: ['Eigene Anordnung; Maus/Touch statt Stift; Normen der Papierversion nicht übertragbar.'],
		references: [
			'Reitan, R. M. (1958). Validity of the Trail Making Test as an indicator of organic brain damage. Perceptual and Motor Skills, 8, 271–276.',
			'Tombaugh, T. N. (2004). Trail Making Test A and B: Normative data stratified by age and education. Archives of Clinical Neuropsychology, 19, 203–214.'
		]
	},
	{
		id: 'trail-making-b',
		paradigm: 'Trail Making Test, Teil B (kognitive Flexibilität, Set-Wechsel).',
		procedure: 'Übungsbeispiel mit 8 Kreisen, danach 25 Kreise im Wechsel 1–A–2–B … 13.',
		measures: ['Bearbeitungszeit, Fehler', 'B − A und B/A (Abzug des motorischen Tempos aus Teil A)'],
		deviations: ['Wie Teil A.'],
		references: [
			'Reitan, R. M. (1958). Validity of the Trail Making Test as an indicator of organic brain damage. Perceptual and Motor Skills, 8, 271–276.',
			'Arbuthnott, K., & Frank, J. (2000). Trail Making Test, Part B as a measure of executive control: Validation using a set-switching paradigm. Journal of Clinical and Experimental Neuropsychology, 22, 518–528.'
		]
	},
	{
		id: 'wcst',
		paradigm: 'Wisconsin Card Sorting Test (Regelerkennung, Set-Shifting).',
		procedure:
			'4 Schlüsselkarten, 128 Antwortkarten (2 × alle 64 Kombinationen aus Farbe, Form, Anzahl; feste Reihenfolge für alle Testungen, inkl. mehrdeutiger Karten). Regelfolge Farbe → Form → Anzahl, Wechsel nach 10 korrekten Zuordnungen in Folge, Abbruch nach 6 Kategorien oder 128 Karten.',
		measures: [
			'Kategorien, Fehler, perseverative Antworten und Fehler (Heaton-Regeln inkl. Sandwich-Regel, vereinfacht)',
			'Konzeptuelle Antworten (Folgen ≥ 3 korrekt), Failure to Maintain Set, Durchgänge bis zur 1. Kategorie'
		],
		deviations: [
			'Eigene Kartenreihenfolge (die Originalreihenfolge ist urheberrechtlich geschützt); Perseverationswertung vereinfacht.',
			'Keine Normdaten; Heaton-Normen nicht übertragbar.'
		],
		references: [
			'Grant, D. A., & Berg, E. A. (1948). A behavioral analysis of degree of reinforcement and ease of shifting to new responses in a Weigl-type card-sorting problem. Journal of Experimental Psychology, 38, 404–411.',
			'Heaton, R. K., Chelune, G. J., Talley, J. L., Kay, G. G., & Curtiss, G. (1993). Wisconsin Card Sorting Test Manual: Revised and Expanded. Psychological Assessment Resources.'
		]
	},
	{
		id: 'tower',
		paradigm: 'Turm von London (Planen und Problemlösen).',
		procedure:
			'3 Stäbe (Kapazität 3/2/1), 3 Scheiben, 10 Aufgaben mit 1–7 Minimalzügen (per Breitensuche verifiziert). Die Minimalzahl wird angezeigt; Abbruch einer Aufgabe bei Zugobergrenze oder nach 2 min.',
		measures: ['Mit Minimalzügen gelöste Aufgaben', 'Überzählige Züge, Planungszeit (bis zum 1. Zug), Ausführungszeit, Regelverstöße'],
		deviations: ['Eigene Aufgabenauswahl; Klicksteuerung; keine Normdaten (TOL-DX-Normen nicht übertragbar).'],
		references: [
			'Shallice, T. (1982). Specific impairments of planning. Philosophical Transactions of the Royal Society of London B, 298, 199–209.',
			'Culbertson, W. C., & Zillmer, E. A. (2005). Tower of London – Drexel University (TOL-DX), 2nd ed. Multi-Health Systems.'
		]
	},
	{
		id: 'word-list',
		paradigm: 'Verbaler Lern- und Merkfähigkeitstest nach dem Vorbild des RAVLT/VLMT.',
		procedure:
			'Liste A (15 Wörter, deutsche Übersetzung der RAVLT-Liste A) 5 × dargeboten (gesprochen, 1 Wort / 2 s), je freier Abruf (60 s); dann Interferenzliste B mit Abruf; dann Abruf von Liste A (A6). Keine Rückmeldung über die Leistung.',
		measures: [
			'Summe A1–A5, Lernzuwachs (Σ − 5 × A1), Lernsteigung',
			'Proaktive (B/A1) und retroaktive Interferenz (A6/A5)',
			'Intrusionen, Primacy/Recency'
		],
		deviations: [
			'Synthetische Stimme, langsamere Darbietung (2 s statt 1 s pro Wort), Eingabe per Tastatur statt mündlich.',
			'Keine Normdaten; RAVLT-/VLMT-Normen nicht übertragbar.'
		],
		references: [
			'Rey, A. (1964). L’examen clinique en psychologie. Presses Universitaires de France.',
			'Schmidt, M. (1996). Rey Auditory Verbal Learning Test: A Handbook. Western Psychological Services.',
			'Helmstaedter, C., Lendt, M., & Lux, S. (2001). Verbaler Lern- und Merkfähigkeitstest (VLMT). Beltz.'
		]
	},
	{
		id: 'delayed-recall',
		paradigm: 'Verzögerter Abruf und Wiedererkennen der Wortliste (RAVLT-Durchgänge A7 und Rekognition).',
		procedure:
			'Frühestens 20 min nach der Wortliste (Unterschreitung wird markiert): freier Abruf von Liste A (90 s), danach Ja/Nein-Wiedererkennung von 45 Wörtern (15 aus Liste A, 15 aus Liste B, 15 semantisch/phonologisch ähnliche neue Wörter).',
		measures: [
			'A7, Behaltensquote A7/A5',
			'Wiedererkennung: Treffer, Falsch-Positive (davon Quellenverwechslungen mit Liste B), Treffer − FP, d′'
		],
		deviations: ['Wie Wortliste.'],
		references: ['Schmidt, M. (1996). Rey Auditory Verbal Learning Test: A Handbook. Western Psychological Services.']
	},
	{
		id: 'rey-figure',
		paradigm: 'Visuelles Wiedererkennen von Figurelementen (angelehnt an den Wiedererkennungsdurchgang des RCFT).',
		procedure:
			'30 s Einprägen einer komplexen Figur, danach sofortige Ja/Nein-Wiedererkennung (9 Figurelemente, 9 neue Elemente), 60 s Pause, verzögerte Wiedererkennung mit anderen Elementen (9 + 9).',
		measures: ["d′, Treffer und Falsch-Positive (sofort und verzögert)"],
		deviations: [
			'KEIN Rey-Osterrieth-Test: weder Abzeichnen noch freie Reproduktion, eigene vereinfachte Figur. Erfasst nur visuelles Wiedererkennen, keine Visuokonstruktion.',
			'Keine Normdaten.'
		],
		references: [
			'Meyers, J. E., & Meyers, K. R. (1995). Rey Complex Figure Test and Recognition Trial: Professional Manual. Psychological Assessment Resources.'
		]
	}
];
