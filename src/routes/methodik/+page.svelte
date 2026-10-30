<script lang="ts">
  import { GENERAL_REFERENCES, TEST_REFERENCES } from '$lib/tests/methods.js';
  import { ALL_TESTS } from '$lib/tests/registry.js';
  import { methodsText, t } from '$lib/i18n/index.js';
  import { ANTICIPATION_THRESHOLD_MS, RT_OUTLIER_SD } from '$lib/utils/statistics.js';

  const i = t();
  const m = methodsText();
</script>

<svelte:head>
  <title>{i.app.pageTitle(m.title)}</title>
</svelte:head>

<div class="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
  <h1 class="text-2xl font-bold text-slate-900 mb-2">{m.title}</h1>
  <p class="text-slate-500 mb-6">{m.intro}</p>

  <section
    class="mb-8 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:p-5 text-sm text-amber-800"
  >
    <h2 class="font-semibold mb-2">{m.statusTitle}</h2>
    <p class="mb-2">{m.statusText1}</p>
    <p>{m.statusText2}</p>
  </section>

  <section class="mb-8 space-y-3 text-sm text-slate-600">
    <h2 class="text-lg font-semibold text-slate-800">{m.generalTitle}</h2>
    {#each m.general as item (item.title)}
      <p>
        <strong class="text-slate-800">{item.title}</strong>
        {typeof item.text === 'function'
          ? item.text(ANTICIPATION_THRESHOLD_MS, RT_OUTLIER_SD)
          : item.text}
      </p>
    {/each}
  </section>

  <section class="mb-8">
    <h2 class="text-lg font-semibold text-slate-800 mb-3">{m.testsTitle}</h2>
    <div class="space-y-3">
      {#each ALL_TESTS as test (test.id)}
        {@const method = m.tests[test.id as keyof typeof m.tests]}
        <details id={test.id} class="group rounded-xl border border-slate-200 bg-surface">
          <summary
            class="flex cursor-pointer list-none items-center justify-between gap-3 px-4 sm:px-5 py-3"
          >
            <span class="font-medium text-slate-900">{test.name}</span>
            <span
              class="text-slate-400 transition-transform group-open:rotate-90"
              aria-hidden="true">›</span
            >
          </summary>
          <div class="space-y-3 border-t border-slate-100 px-4 sm:px-5 py-4 text-sm text-slate-600">
            <p>{method.paradigm}</p>
            <div>
              <h3 class="font-medium text-slate-800 mb-1">{m.procedure}</h3>
              <p>{method.procedure}</p>
            </div>
            <div>
              <h3 class="font-medium text-slate-800 mb-1">{m.measures}</h3>
              <ul class="list-disc pl-5 space-y-0.5">
                {#each method.measures as item (item)}<li>{item}</li>{/each}
              </ul>
            </div>
            <div>
              <h3 class="font-medium text-slate-800 mb-1">{m.deviations}</h3>
              <ul class="list-disc pl-5 space-y-0.5">
                {#each method.deviations as item (item)}<li>{item}</li>{/each}
              </ul>
            </div>
            <div>
              <h3 class="font-medium text-slate-800 mb-1">{m.literature}</h3>
              <ul class="space-y-1 text-xs text-slate-500">
                {#each TEST_REFERENCES[test.id] ?? [] as ref (ref)}<li>{ref}</li>{/each}
              </ul>
            </div>
          </div>
        </details>
      {/each}
    </div>
  </section>

  <section>
    <h2 class="text-lg font-semibold text-slate-800 mb-3">{m.generalLiterature}</h2>
    <ul class="space-y-1 text-xs text-slate-500">
      {#each GENERAL_REFERENCES as ref (ref)}<li>{ref}</li>{/each}
    </ul>
  </section>
</div>
