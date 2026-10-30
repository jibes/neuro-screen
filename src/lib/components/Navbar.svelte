<script lang="ts">
  import { base, resolve } from '$app/paths';
  import { t } from '$lib/i18n/index.js';
  import { page } from '$app/state';
  import ThemeToggle from './ThemeToggle.svelte';
  import LanguageToggle from './LanguageToggle.svelte';
  import favicon from '$lib/assets/favicon.svg';
  const i = t();

  const links = [
    { href: resolve('/'), label: i.nav.home },
    { href: resolve('/umgebung'), label: i.nav.environment },
    { href: resolve('/ergebnisse'), label: i.nav.results },
    { href: resolve('/methodik'), label: i.nav.methods },
  ];

  /** Compare paths ignoring a trailing slash (the base root may be served as /repo or /repo/) */
  const normalize = (path: string) => path.replace(/\/+$/, '') || '/';
  const home = normalize(`${base}/`);
  /** Home matches exactly; other sections also match their sub-pages (e.g. a result detail) */
  const isActive = (href: string) => {
    const current = normalize(page.url.pathname);
    const target = normalize(href);
    return target === home
      ? current === home
      : current === target || current.startsWith(`${target}/`);
  };
</script>

<nav
  class="sticky top-0 z-20 bg-surface/90 backdrop-blur border-b border-slate-200 px-4 sm:px-6 py-3"
>
  <div class="max-w-5xl mx-auto flex flex-wrap items-center gap-x-6 gap-y-2">
    <a
      href={resolve('/')}
      class="flex items-center gap-2 text-lg font-semibold text-slate-900 hover:text-blue-600 transition-colors"
    >
      <img src={favicon} alt="" class="h-6 w-6" />
      {i.app.title}
    </a>
    <div class="order-3 sm:order-2 flex flex-wrap w-full sm:w-auto gap-x-4 gap-y-1 sm:gap-x-6">
      {#each links as link (link.href)}
        <a
          href={link.href}
          aria-current={isActive(link.href) ? 'page' : undefined}
          class="text-sm py-1 transition-colors {isActive(link.href)
            ? 'text-blue-600 font-medium'
            : 'text-slate-600 hover:text-slate-900'}"
        >
          {link.label}
        </a>
      {/each}
    </div>
    <div class="order-2 sm:order-3 ml-auto flex items-center gap-2">
      <LanguageToggle />
      <ThemeToggle />
    </div>
  </div>
</nav>
