<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import Navbar from '$lib/components/Navbar.svelte';
  import DisclaimerBanner from '$lib/components/DisclaimerBanner.svelte';
  import UpdateBanner from '$lib/components/UpdateBanner.svelte';
  import { formatDateTime, t } from '$lib/i18n/index.js';
  import { page } from '$app/state';
  import { base } from '$app/paths';
  import { startSessionInit } from '$lib/db/session-store.svelte.js';
  import { gatherEnvironmentInfo } from '$lib/core/environment-check.js';
  import { initTheme } from '$lib/theme.svelte.js';
  import { initPwa } from '$lib/pwa.svelte.js';
  import favicon from '$lib/assets/favicon.svg';

  let { children } = $props();
  const i = t();

  // Hide chrome (navbar, disclaimer) during active tests
  const isTestPage = $derived(page.url.pathname.startsWith(`${base}/tests/`));

  // Ensure a session exists so test results can be saved
  onMount(() => {
    initTheme();
    initPwa();
    startSessionInit(() => gatherEnvironmentInfo());
  });
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

{#if !isTestPage}
  <DisclaimerBanner />
  <Navbar />
{/if}

<main>
  {@render children()}
</main>

{#if !isTestPage}
  <!-- Never interrupt a running test with the update prompt -->
  <UpdateBanner />
  <footer class="max-w-5xl mx-auto px-4 sm:px-6 pb-8 pt-4 text-center text-xs text-slate-400">
    {i.build(__BUILD__.build, formatDateTime(__BUILD__.time))} ·
    <a href="https://github.com/jibes/neuro-screen" class="underline hover:text-slate-600"
      >GPL-3.0</a
    >
  </footer>
{/if}
