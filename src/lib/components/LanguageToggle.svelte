<script lang="ts">
  import { getLocale, LOCALES, setLocale, t } from '$lib/i18n/index.js';

  const i = t();
  const current = getLocale();
</script>

<div
  class="inline-flex items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5"
  role="radiogroup"
  aria-label={i.language.label}
>
  {#each LOCALES as locale (locale)}
    <button
      type="button"
      role="radio"
      aria-checked={current === locale}
      title={i.language[locale]}
      lang={locale}
      onclick={() => locale !== current && setLocale(locale)}
      class="h-7 min-w-8 rounded-md px-1.5 text-xs font-semibold uppercase transition-colors {current ===
      locale
        ? 'bg-surface text-slate-900 shadow-sm'
        : 'text-slate-500 hover:text-slate-800'}"
    >
      {locale}
    </button>
  {/each}
</div>
