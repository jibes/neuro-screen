<script lang="ts">
	import { TEST_METHODS, GENERAL_REFERENCES } from '$lib/tests/methods.js';
	import { getTestName } from '$lib/tests/registry.js';
	import { ANTICIPATION_THRESHOLD_MS, RT_OUTLIER_SD } from '$lib/utils/statistics.js';
</script>

<svelte:head>
	<title>Methodik · NeuroScreen</title>
</svelte:head>

<div class="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
	<h1 class="text-2xl font-bold text-slate-900 mb-2">Methodik</h1>
	<p class="text-slate-500 mb-6">Grundlagen, Durchführung und Grenzen der Tests.</p>

	<section class="mb-8 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:p-5 text-sm text-amber-800">
		<h2 class="font-semibold mb-2">Validierungsstatus: experimentell</h2>
		<p class="mb-2">
			Alle Tests beruhen auf etablierten Paradigmen der Neuropsychologie, diese Umsetzungen sind jedoch
			<strong>nicht normiert und nicht validiert</strong>. Es gibt keine alters- oder bildungsbezogenen Vergleichswerte;
			die Ergebnisse sind Rohwerte und erlauben keine Einordnung als „auffällig“ oder „unauffällig“.
		</p>
		<p>
			Geeignet sind sie für Verlaufsvergleiche derselben Person (gleiches Gerät), für Forschung mit eigener
			Kontrollgruppe sowie für Lehre und Demonstration – nicht für Diagnostik.
		</p>
	</section>

	<section class="mb-8 space-y-3 text-sm text-slate-600">
		<h2 class="text-lg font-semibold text-slate-800">Allgemeine Verfahren</h2>
		<p>
			<strong class="text-slate-800">Zeitmessung.</strong> Reizbeginn wird mit dem Bild-Frame synchronisiert, Antwortzeiten
			über Ereignis-Zeitstempel erfasst. Browser, Bildschirm und Eingabegerät verursachen dennoch Verzögerungen von etwa
			10–50 ms; Reaktionszeiten sind daher nur innerhalb desselben Geräts gut vergleichbar. Touch- und Tastatureingabe werden
			je Durchgang gespeichert.
		</p>
		<p>
			<strong class="text-slate-800">Reaktionszeit-Bereinigung.</strong> Antworten unter {ANTICIPATION_THRESHOLD_MS} ms gelten
			als Antizipationen, anschließend werden Werte außerhalb von ±{RT_OUTLIER_SD} SD je Bedingung ausgeschlossen. Berichtet
			werden Mittelwerte und Mediane korrekter Durchgänge sowie die Zahl ausgeschlossener Werte.
		</p>
		<p>
			<strong class="text-slate-800">Signalentdeckung.</strong> d′ und c werden mit log-linearer Korrektur berechnet, damit
			Trefferquoten von 0 oder 1 keine unendlichen Werte erzeugen.
		</p>
		<p>
			<strong class="text-slate-800">Reizfolgen.</strong> Bedingungen sind balanciert; Folgen werden zufällig unter
			Nebenbedingungen erzeugt (z. B. höchstens 3 gleiche Bedingungen in Folge). Der WCST nutzt eine feste Kartenfolge.
		</p>
		<p>
			<strong class="text-slate-800">Datenqualität.</strong> Ergebnisse nahe dem Zufallsniveau, viele Auslassungen oder
			Antizipationen, Unterbrechungen und Touch-Eingabe werden als Hinweise gespeichert und angezeigt.
		</p>
		<p>
			<strong class="text-slate-800">Datenschutz.</strong> Alle Daten bleiben lokal im Browser (IndexedDB); es findet keine
			Übertragung statt.
		</p>
	</section>

	<section class="mb-8">
		<h2 class="text-lg font-semibold text-slate-800 mb-3">Tests</h2>
		<div class="space-y-3">
			{#each TEST_METHODS as method}
				<details id={method.id} class="group rounded-xl border border-slate-200 bg-surface">
					<summary class="flex cursor-pointer list-none items-center justify-between gap-3 px-4 sm:px-5 py-3">
						<span class="font-medium text-slate-900">{getTestName(method.id)}</span>
						<span class="text-slate-400 transition-transform group-open:rotate-90" aria-hidden="true">›</span>
					</summary>
					<div class="space-y-3 border-t border-slate-100 px-4 sm:px-5 py-4 text-sm text-slate-600">
						<p>{method.paradigm}</p>
						<div>
							<h3 class="font-medium text-slate-800 mb-1">Durchführung</h3>
							<p>{method.procedure}</p>
						</div>
						<div>
							<h3 class="font-medium text-slate-800 mb-1">Kennwerte</h3>
							<ul class="list-disc pl-5 space-y-0.5">
								{#each method.measures as m}<li>{m}</li>{/each}
							</ul>
						</div>
						<div>
							<h3 class="font-medium text-slate-800 mb-1">Abweichungen vom Original / Grenzen</h3>
							<ul class="list-disc pl-5 space-y-0.5">
								{#each method.deviations as d}<li>{d}</li>{/each}
							</ul>
						</div>
						<div>
							<h3 class="font-medium text-slate-800 mb-1">Literatur</h3>
							<ul class="space-y-1 text-xs text-slate-500">
								{#each method.references as r}<li>{r}</li>{/each}
							</ul>
						</div>
					</div>
				</details>
			{/each}
		</div>
	</section>

	<section>
		<h2 class="text-lg font-semibold text-slate-800 mb-3">Allgemeine Literatur</h2>
		<ul class="space-y-1 text-xs text-slate-500">
			{#each GENERAL_REFERENCES as r}<li>{r}</li>{/each}
		</ul>
	</section>
</div>
