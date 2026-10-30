import type { MethodsCatalogue } from './methods.en.js';

export const methodsDe = {
  title: 'Methodik',
  intro: 'Grundlagen, Durchführung und Grenzen der Tests.',
  statusTitle: 'Validierungsstatus: experimentell',
  statusText1:
    'Alle Tests beruhen auf etablierten Paradigmen der Neuropsychologie, diese Umsetzungen sind jedoch nicht normiert und nicht validiert. Es gibt keine alters- oder bildungsbezogenen Vergleichswerte; die Ergebnisse sind Rohwerte und erlauben keine Einordnung als „auffällig“ oder „unauffällig“.',
  statusText2:
    'Geeignet sind sie für Verlaufsvergleiche derselben Person (gleiches Gerät), für Forschung mit eigener Kontrollgruppe sowie für Lehre und Demonstration – nicht für Diagnostik.',
  generalTitle: 'Allgemeine Verfahren',
  general: [
    {
      title: 'Zeitmessung.',
      text: 'Der Reizbeginn wird mit dem Bild-Frame synchronisiert, Antwortzeiten werden über Ereignis-Zeitstempel erfasst. Browser, Bildschirm und Eingabegerät verursachen dennoch Verzögerungen von etwa 10–50 ms; Reaktionszeiten sind daher nur innerhalb desselben Geräts gut vergleichbar. Touch- und Tastatureingabe werden je Durchgang gespeichert.',
    },
    {
      title: 'Reaktionszeit-Bereinigung.',
      text: (minRt: number, sd: number) =>
        `Antworten unter ${minRt} ms gelten als Antizipationen, anschließend werden Werte außerhalb von ±${sd} SD je Bedingung ausgeschlossen. Berichtet werden Mittelwerte und Mediane korrekter Durchgänge sowie die Zahl ausgeschlossener Werte.`,
    },
    {
      title: 'Signalentdeckung.',
      text: 'd′ und c werden mit log-linearer Korrektur berechnet, damit Trefferquoten von 0 oder 1 keine unendlichen Werte erzeugen.',
    },
    {
      title: 'Reizfolgen.',
      text: 'Bedingungen sind balanciert; Folgen werden zufällig unter Nebenbedingungen erzeugt (z. B. höchstens 3 gleiche Bedingungen in Folge). Der WCST nutzt eine feste Kartenfolge.',
    },
    {
      title: 'Datenqualität.',
      text: 'Ergebnisse nahe dem Zufallsniveau, viele Auslassungen oder Antizipationen, Unterbrechungen und Touch-Eingabe werden als Hinweise gespeichert und angezeigt.',
    },
    {
      title: 'Sprache.',
      text: 'Sprachliches Material (Wortlisten, Stroop-Farbwörter, gesprochene Ziffern) hängt von der gewählten Sprache ab; die Sprache wird mit jedem Lauf gespeichert. Ergebnisse aus verschiedenen Sprachen sind nicht vergleichbar.',
    },
    {
      title: 'Datenschutz.',
      text: 'Alle Daten bleiben lokal im Browser (IndexedDB); es findet keine Übertragung statt.',
    },
  ],
  testsTitle: 'Tests',
  procedure: 'Durchführung',
  measures: 'Kennwerte',
  deviations: 'Abweichungen vom Original / Grenzen',
  literature: 'Literatur',
  generalLiterature: 'Allgemeine Literatur',
  tests: {
    'go-nogo': {
      paradigm: 'Go/No-Go-Aufgabe zur Reaktionshemmung.',
      procedure:
        '60 Durchgänge (75 % Go, 25 % No-Go; max. 2 No-Go in Folge), Fixation 500 ms, Reiz 500 ms, Antwortfenster 1500 ms ab Reizbeginn, ITI 800–1200 ms. Übungsblock (10 Durchgänge, Rückmeldung, ≥ 60 % korrekt).',
      measures: [
        'Kommissionsfehler (Reaktion auf No-Go) als Maß der Inhibition',
        'Auslassungen, Treffer-RT (M, Md, SD) nach Bereinigung',
        'd′ und Antworttendenz c (Signalentdeckung, log-lineare Korrektur)',
      ],
      deviations: ['Farbige Kreise statt Buchstaben/Formen; keine Normdaten.'],
    },
    flanker: {
      paradigm: 'Eriksen-Flanker-Aufgabe (Pfeilversion) zur Interferenzkontrolle.',
      procedure:
        '80 Durchgänge (50 % kongruent, 50 % inkongruent, Zielrichtung balanciert; max. 3 gleiche Bedingungen bzw. Antworten in Folge), Antwort mit Pfeiltasten, Antwortfenster 1500 ms. Übungsblock mit Rückmeldung.',
      measures: [
        'Flanker-Effekt = RT inkongruent − RT kongruent (korrekte Durchgänge; Mittelwert und Median)',
        'Fehler je Bedingung, fehlende Antworten',
      ],
      deviations: ['Keine neutrale Bedingung; keine Normdaten.'],
    },
    stroop: {
      paradigm: 'Farb-Wort-Interferenz (Stroop), computerisierte Einzeldurchgangsversion.',
      procedure:
        '108 Durchgänge (je 36 kongruent, inkongruent, neutral „XXXX“; Farben und Farb-Wort-Paarungen vollständig balanciert). Keine Wiederholung der Schriftfarbe in aufeinanderfolgenden Durchgängen und kein Wort, das die vorherige Schriftfarbe benennt (Kontrolle von Antwort-Priming und negativem Priming); max. 3 gleiche Bedingungen in Folge. Antwort per Taste (D/F/J/K).',
      measures: [
        'Stroop-Effekt (inkongruent − kongruent), Interferenz (inkongruent − neutral), Fazilitation (neutral − kongruent)',
        'Mittelwerte und Mediane korrekter Durchgänge; Fehler je Bedingung',
      ],
      deviations: [
        'Tastenantwort statt Benennen der Farbe (manuelle Stroop-Effekte sind kleiner als vokale).',
        'Keine Normdaten.',
      ],
    },
    cpt: {
      paradigm: 'Continuous Performance Test (CPT-X) zur Daueraufmerksamkeit.',
      procedure:
        '200 Buchstaben in 4 Blöcken à 50 (je Block gleich viele Zielreize „X“, 20 %), Darbietung 250 ms, feste Reizfolge (SOA ≈ 2 s unabhängig von der Antwort).',
      measures: [
        'Auslassungen, Kommissionen, d′, c',
        'Treffer-RT, intraindividuelle Variabilität (CV)',
        'Leistungsverlauf über die Blöcke (Vigilanzabfall): RT, Auslassungen und Kommissionen je Block',
      ],
      deviations: ['Kürzer als klinische CPTs (z. B. Conners CPT 14 min); keine Normdaten.'],
    },
    'n-back': {
      paradigm: 'Verbale 2-Back-Aufgabe zur Aktualisierung des Arbeitsgedächtnisses.',
      procedure:
        '60 Konsonanten, 30 % Zielreize, Darbietung 500 ms, feste Reizfolge (SOA ≈ 3 s). Übungsblock mit Rückmeldung.',
      measures: ['Treffer, falsche Alarme, d′', 'Treffer-RT (M, Md)'],
      deviations: [
        'Nur eine Stufe (2-Back); keine Kontrolle von Köder-Durchgängen (Lures); keine Normdaten.',
      ],
    },
    'digit-span': {
      paradigm: 'Zahlenspanne vorwärts und rückwärts (verbales Kurzzeit- bzw. Arbeitsgedächtnis).',
      procedure:
        'Vorgehen nach WAIS-IV: je 2 Durchgänge pro Länge (vorwärts 2–9, rückwärts 2–8), Abbruch, wenn beide Durchgänge einer Länge falsch sind, 1 Ziffer pro Sekunde, gesprochene Darbietung (Sprachsynthese), keine Rückmeldung im Test. Übungsdurchgänge vor beiden Teilen.',
      measures: [
        'Längste korrekte Spanne vorwärts/rückwärts',
        'Rohwert = Anzahl korrekter Durchgänge je Richtung',
      ],
      deviations: [
        'Eigene Zufallsfolgen statt der WAIS-Itemfolgen; synthetische Stimme; Eingabe per Tastatur statt mündlich.',
        'Ohne Sprachausgabe visuelle Darbietung (wird gespeichert).',
        'Keine Normdaten; WAIS-Normen nicht übertragbar.',
      ],
    },
    corsi: {
      paradigm:
        'Corsi-Block-Tapping (visuell-räumliches Arbeitsgedächtnis), vorwärts und rückwärts.',
      procedure:
        '9 Blöcke, Sequenzen ohne Wiederholung, 1 Block pro Sekunde, je 2 Durchgänge pro Länge ab 2, Abbruch nach 2 Fehlern einer Länge, keine Rückmeldung im Test. Übungsdurchgänge vor beiden Teilen.',
      measures: [
        'Blockspanne vorwärts/rückwärts',
        'Gesamtscore = Spanne × korrekte Folgen (Kessels et al., 2000)',
      ],
      deviations: [
        'Eigene Blockanordnung statt der Originalkoordinaten; Bildschirm statt Holzbrett; keine Normdaten.',
      ],
    },
    'symbol-digit': {
      paradigm:
        'Symbol-Zahlen-Zuordnung (angelehnt an SDMT/DSST) zur Verarbeitungsgeschwindigkeit.',
      procedure:
        '10 ungezeitete Übungsitems mit Rückmeldung, danach 90 s; feste Zuordnung von 9 Symbolen zu den Ziffern 1–9.',
      measures: ['Anzahl korrekter Zuordnungen in 90 s', 'Fehler, Bearbeitungsrate'],
      deviations: [
        'Eigene Symbole; Tastatur/Ziffernfeld statt schriftlicher oder mündlicher Antwort; keine Normdaten.',
      ],
    },
    'trail-making-a': {
      paradigm: 'Trail Making Test, Teil A (visuelle Suche, psychomotorisches Tempo).',
      procedure:
        'Übungsbeispiel mit 8 Kreisen, danach 25 Kreise (1–25) per Klick/Tipp verbinden; Fehler werden sofort angezeigt.',
      measures: ['Bearbeitungszeit', 'Fehler', 'Segmentzeiten'],
      deviations: [
        'Eigene Anordnung; Maus/Touch statt Stift; Normen der Papierversion nicht übertragbar.',
      ],
    },
    'trail-making-b': {
      paradigm: 'Trail Making Test, Teil B (kognitive Flexibilität, Set-Wechsel).',
      procedure: 'Übungsbeispiel mit 8 Kreisen, danach 25 Kreise im Wechsel 1–A–2–B … 13.',
      measures: [
        'Bearbeitungszeit, Fehler',
        'B − A und B/A (Abzug des motorischen Tempos aus Teil A)',
      ],
      deviations: ['Wie Teil A.'],
    },
    wcst: {
      paradigm: 'Wisconsin Card Sorting Test (Regelerkennung, Set-Shifting).',
      procedure:
        '4 Schlüsselkarten, 128 Antwortkarten (2 × alle 64 Kombinationen aus Farbe, Form, Anzahl; feste Reihenfolge für alle Testungen, inkl. mehrdeutiger Karten). Regelfolge Farbe → Form → Anzahl, Wechsel nach 10 korrekten Zuordnungen in Folge, Abbruch nach 6 Kategorien oder 128 Karten.',
      measures: [
        'Kategorien, Fehler, perseverative Antworten und Fehler (Heaton-Regeln inkl. Sandwich-Regel, vereinfacht)',
        'Konzeptuelle Antworten (Folgen ≥ 3 korrekt), Failure to Maintain Set, Durchgänge bis zur 1. Kategorie',
      ],
      deviations: [
        'Eigene Kartenreihenfolge (die Originalreihenfolge ist urheberrechtlich geschützt); Perseverationswertung vereinfacht.',
        'Keine Normdaten; Heaton-Normen nicht übertragbar.',
      ],
    },
    tower: {
      paradigm: 'Turm von London (Planen und Problemlösen).',
      procedure:
        '3 Stäbe (Kapazität 3/2/1), 3 Scheiben, 10 Aufgaben mit 1–7 Minimalzügen (per Breitensuche verifiziert). Die Minimalzahl wird angezeigt; Abbruch einer Aufgabe bei Zugobergrenze oder nach 2 min.',
      measures: [
        'Mit Minimalzügen gelöste Aufgaben',
        'Überzählige Züge, Planungszeit (bis zum 1. Zug), Ausführungszeit, Regelverstöße',
      ],
      deviations: [
        'Eigene Aufgabenauswahl; Klicksteuerung; keine Normdaten (TOL-DX-Normen nicht übertragbar).',
      ],
    },
    'word-list': {
      paradigm: 'Verbaler Lern- und Merkfähigkeitstest nach dem Vorbild des RAVLT/VLMT.',
      procedure:
        'Liste A (15 Wörter; Deutsch: Übersetzung, Englisch: Original der RAVLT-Liste A) 5 × dargeboten (gesprochen, 1 Wort / 2 s), je freier Abruf (60 s); dann Interferenzliste B mit Abruf; dann Abruf von Liste A (A6). Keine Rückmeldung über die Leistung.',
      measures: [
        'Summe A1–A5, Lernzuwachs (Σ − 5 × A1), Lernsteigung',
        'Proaktive (B/A1) und retroaktive Interferenz (A6/A5)',
        'Intrusionen, Primacy/Recency',
      ],
      deviations: [
        'Synthetische Stimme, langsamere Darbietung (2 s statt 1 s pro Wort), Eingabe per Tastatur statt mündlich.',
        'Keine Normdaten; RAVLT-/VLMT-Normen nicht übertragbar.',
      ],
    },
    'delayed-recall': {
      paradigm:
        'Verzögerter Abruf und Wiedererkennen der Wortliste (RAVLT-Durchgänge A7 und Rekognition).',
      procedure:
        'Frühestens 20 min nach der Wortliste (Unterschreitung wird markiert): freier Abruf von Liste A (90 s), danach Ja/Nein-Wiedererkennung von 45 Wörtern (15 aus Liste A, 15 aus Liste B, 15 semantisch/phonologisch ähnliche neue Wörter).',
      measures: [
        'A7, Behaltensquote A7/A5',
        'Wiedererkennung: Treffer, Falsch-Positive (davon Quellenverwechslungen mit Liste B), Treffer − FP, d′',
      ],
      deviations: ['Wie Wortliste.'],
    },
    'rey-figure': {
      paradigm:
        'Visuelles Wiedererkennen von Figurelementen (angelehnt an den Wiedererkennungsdurchgang des RCFT).',
      procedure:
        '30 s Einprägen einer komplexen Figur, danach sofortige Ja/Nein-Wiedererkennung (9 Figurelemente, 9 neue Elemente), 60 s Pause, verzögerte Wiedererkennung mit anderen Elementen (9 + 9).',
      measures: ['d′, Treffer und Falsch-Positive (sofort und verzögert)'],
      deviations: [
        'KEIN Rey-Osterrieth-Test: weder Abzeichnen noch freie Reproduktion, eigene vereinfachte Figur. Erfasst nur visuelles Wiedererkennen, keine Visuokonstruktion.',
        'Keine Normdaten.',
      ],
    },
  },
} satisfies MethodsCatalogue;
