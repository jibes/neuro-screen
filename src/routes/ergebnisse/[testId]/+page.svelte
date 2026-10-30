<script lang="ts">
  import { resolve } from '$app/paths';
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { formatDateTime, num, t } from '$lib/i18n/index.js';
  import { getTestRun, getTrials, getLatestTestRun } from '$lib/db/database.js';
  import { trialsToCSV, downloadFile } from '$lib/db/export.js';
  import type { TestRun, TrialData } from '$lib/db/models.js';
  import { getTestName } from '$lib/tests/registry.js';
  import { safeSummaryEntries } from '$lib/results/format.js';
  import { renderQualityFlag } from '$lib/core/quality.js';
  import { renderEnvironmentFlag } from '$lib/core/environment-check.js';

  const i = t();

  let testRun = $state<TestRun | null>(null);
  let trials = $state<TrialData[]>([]);
  let loading = $state(true);
  /** Completion time of the latest Trail Making A in the same session (for B − A, B/A) */
  let trailA = $state<number | null>(null);

  const testId = $derived(Number(page.params.testId));
  const entries = $derived(
    testRun ? safeSummaryEntries(testRun.summary, { trailAMs: trailA }) : [],
  );

  onMount(async () => {
    if (!isNaN(testId)) {
      testRun = (await getTestRun(testId)) ?? null;
      if (testRun?.id) {
        trials = await getTrials(testRun.id);
        if (testRun.testId === 'trail-making-b') {
          const a = await getLatestTestRun(testRun.sessionId, 'trail-making-a');
          if (a?.summary.type === 'trail-making') trailA = a.summary.completionTimeMs;
        }
      }
    }
    loading = false;
  });

  function handleExportCSV() {
    if (trials.length === 0) return;
    const csv = trialsToCSV(trials);
    downloadFile(csv, `${testRun?.testId ?? 'test'}-trials.csv`, 'text/csv');
  }
</script>

<svelte:head>
  <title>
    {i.app.pageTitle(
      testRun ? `${getTestName(testRun.testId)} · ${i.results.title}` : i.results.title,
    )}
  </title>
</svelte:head>

<div class="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
  {#if loading}
    <p class="text-slate-400">{i.common.loading}</p>
  {:else if !testRun}
    <p class="text-slate-400">{i.results.notFound}</p>
    <a
      href={resolve('/ergebnisse')}
      class="text-blue-600 text-sm hover:underline mt-2 inline-block"
    >
      {i.common.backToOverview}
    </a>
  {:else}
    <div class="flex flex-wrap items-end justify-between gap-3 mb-6">
      <div>
        <a
          href={resolve('/ergebnisse')}
          class="text-sm text-blue-600 hover:underline mb-2 inline-block"
        >
          &larr; {i.common.backToOverview}
        </a>
        <h1 class="text-2xl font-bold text-slate-900">{getTestName(testRun.testId)}</h1>
        <p class="text-sm text-slate-400">
          {i.results.completedAt}: {formatDateTime(testRun.completedAt)}
        </p>
        {#if testRun.durationMs}
          <p class="text-sm text-slate-400">
            {i.results.duration}: {num(testRun.durationMs / 1000)} s
          </p>
        {/if}
      </div>
      {#if trials.length > 0}
        <button
          onclick={handleExportCSV}
          class="px-4 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
        >
          {i.common.exportCSV}
        </button>
      {/if}
    </div>

    {#if testRun.qualityFlags?.length}
      <div class="bg-red-50 border border-red-100 rounded-lg px-5 py-3 mb-4 text-sm text-red-600">
        <p class="font-medium mb-1">{i.quality.caution}</p>
        <ul class="list-disc pl-5">
          {#each testRun.qualityFlags as flag, idx (idx)}
            <li>{renderQualityFlag(flag)}</li>
          {/each}
        </ul>
      </div>
    {/if}

    {#if testRun.environmentWarnings?.length}
      <div
        class="bg-amber-50 border border-amber-200 rounded-lg px-5 py-3 mb-6 text-sm text-amber-800"
      >
        <p class="font-medium mb-1">{i.results.environmentTitle}</p>
        <ul class="list-disc pl-5">
          {#each testRun.environmentWarnings as warning, idx (idx)}
            <li>{renderEnvironmentFlag(warning)}</li>
          {/each}
        </ul>
      </div>
    {/if}

    <div class="bg-surface rounded-lg border border-slate-200 divide-y divide-slate-100 mb-8">
      {#each entries as entry (entry.label)}
        <div class="flex justify-between items-center gap-4 px-4 sm:px-5 py-3">
          <span class="text-sm text-slate-600">{entry.label}</span>
          <span class="text-sm font-medium text-slate-900 text-right break-words min-w-0"
            >{entry.value}</span
          >
        </div>
      {/each}
    </div>

    {#if trials.length > 0}
      <h2 class="text-lg font-semibold text-slate-800 mb-3">
        {i.results.trialsHeading(trials.length)}
      </h2>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-slate-200 text-left">
              <th class="py-2 px-3 text-slate-500 font-medium">{i.results.colTrial}</th>
              <th class="py-2 px-3 text-slate-500 font-medium">{i.results.colRt}</th>
              <th class="py-2 px-3 text-slate-500 font-medium">{i.results.colCorrect}</th>
            </tr>
          </thead>
          <tbody>
            {#each trials as trial (trial.id)}
              <tr class="border-b border-slate-100">
                <td class="py-1.5 px-3 text-slate-400">{trial.trialNumber + 1}</td>
                <td class="py-1.5 px-3 tabular-nums">{trial.rt !== null ? num(trial.rt) : '–'}</td>
                <td class="py-1.5 px-3">
                  {#if trial.correct === true}
                    <span class="text-green-600">{i.common.yes}</span>
                  {:else if trial.correct === false}
                    <span class="text-red-600">{i.common.no}</span>
                  {:else}
                    <span class="text-slate-400">–</span>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  {/if}
</div>
