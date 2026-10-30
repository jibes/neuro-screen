<script lang="ts">
  import { onMount } from 'svelte';
  import { t } from '$lib/i18n/index.js';
  import { isNative } from '$lib/native.js';

  const i = t();
  let needRefresh = $state(false);
  let updateSW: ((reload?: boolean) => Promise<void>) | null = null;

  onMount(async () => {
    // The Android app ships its files in the APK and updates through releases
    if (isNative || !('serviceWorker' in navigator)) return;
    // Workbox prompt mode: a new version waits until the user accepts it
    const { registerSW } = await import('virtual:pwa-register');
    updateSW = registerSW({
      onNeedRefresh() {
        needRefresh = true;
      },
      onRegisterError(error) {
        console.error('Service worker registration failed:', error);
      },
    });
  });
</script>

{#if needRefresh}
  <div
    class="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
    role="status"
  >
    <div
      class="flex w-full max-w-md flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-surface px-4 py-3 shadow-lg"
    >
      <p class="flex-1 text-sm text-slate-700">{i.update.available}</p>
      <button
        type="button"
        onclick={() => (needRefresh = false)}
        class="px-3 py-1.5 text-sm text-slate-500 hover:text-slate-800"
      >
        {i.update.later}
      </button>
      <button
        type="button"
        onclick={() => updateSW?.(true)}
        class="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
      >
        {i.update.reload}
      </button>
    </div>
  </div>
{/if}
