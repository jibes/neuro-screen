<script lang="ts">
  import { resolve } from '$app/paths';
  import { onMount } from 'svelte';
  import { formatDateTime, t } from '$lib/i18n/index.js';
  import { getLatestSession, getTestRuns, clearAllData } from '$lib/db/database.js';
  import { exportSessionJSON, downloadFile } from '$lib/db/export.js';
  import { clearSession } from '$lib/db/session-store.svelte.js';
  import { getTestName } from '$lib/tests/registry.js';
  import { keyMetric } from '$lib/results/format.js';
  import type { TestRun, Session } from '$lib/db/models.js';

  const i = t();

  let session = $state<Session | null>(null);
  let testRuns = $state<TestRun[]>([]);
  let loading = $state(true);

  onMount(async () => {
    session = (await getLatestSession()) ?? null;
    if (session?.id) {
      testRuns = await getTestRuns(session.id);
    }
    loading = false;
  });

  async function handleExportJSON() {
    if (!session?.id) return;
    const json = await exportSessionJSON(session.id);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    downloadFile(json, `neuroscreen-${timestamp}.json`, 'application/json');
  }

  async function handleClearAll() {
    if (confirm(i.results.confirmDeleteAll)) {
      await clearAllData();
      // The deleted session must not be reused; a fresh one is created on the next save
      clearSession();
      testRuns = [];
      session = null;
    }
  }
</script>

<svelte:head>
  <title>{i.app.pageTitle(i.results.title)}</title>
</svelte:head>

<div class="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
  <div class="flex flex-wrap items-center justify-between gap-3 mb-8">
    <h1 class="text-2xl font-bold text-slate-900">{i.results.title}</h1>
    {#if testRuns.length > 0}
      <div class="flex flex-wrap gap-2">
        <button
          onclick={handleExportJSON}
          class="px-4 py-2 text-sm whitespace-nowrap text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
        >
          {i.common.exportJSON}
        </button>
        <button
          onclick={handleClearAll}
          class="px-4 py-2 text-sm whitespace-nowrap text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
        >
          {i.common.deleteAll}
        </button>
      </div>
    {/if}
  </div>

  {#if loading}
    <p class="text-slate-400">{i.common.loading}</p>
  {:else if testRuns.length === 0}
    <div class="text-center py-16">
      <p class="text-slate-400 text-lg">{i.results.noResults}</p>
      <a
        href={resolve('/')}
        class="inline-block mt-4 px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
      >
        {i.results.startTests}
      </a>
    </div>
  {:else}
    {#if session}
      <p class="text-sm text-slate-400 mb-6">
        {i.results.sessionFrom(formatDateTime(session.startedAt))}
      </p>
    {/if}

    <div class="space-y-3">
      {#each testRuns as run (run.id)}
        <a
          href={resolve('/ergebnisse/[testId]', { testId: String(run.id) })}
          class="block bg-surface rounded-lg border border-slate-200 p-4 sm:p-5 hover:border-blue-300 hover:shadow-sm transition-all"
        >
          <div class="flex flex-wrap items-center justify-between gap-x-3 mb-1">
            <h3 class="font-medium text-slate-900">
              {getTestName(run.testId)}
            </h3>
            <span class="text-xs text-slate-400">
              {formatDateTime(run.completedAt)}
            </span>
          </div>
          <p class="text-sm text-slate-500">{keyMetric(run.summary)}</p>
          {#if run.qualityFlags?.length}
            <p class="mt-1 text-xs text-red-600">
              &#9888; {i.quality.count(run.qualityFlags.length)}
            </p>
          {/if}
        </a>
      {/each}
    </div>
  {/if}
</div>
