<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import Navbar from '$lib/components/Navbar.svelte';
	import DisclaimerBanner from '$lib/components/DisclaimerBanner.svelte';
	import { page } from '$app/state';
	import { startSessionInit } from '$lib/db/session-store.svelte.js';
	import { gatherEnvironmentInfo } from '$lib/core/environment-check.js';

	let { children } = $props();

	// Hide chrome (navbar, disclaimer) during active tests
	const isTestPage = $derived(page.url.pathname.startsWith('/tests/'));

	// Ensure a session exists so test results can be saved
	onMount(() => {
		startSessionInit(() => gatherEnvironmentInfo());
	});
</script>

<svelte:head>
	<title>NeuroScreen</title>
</svelte:head>

{#if !isTestPage}
	<DisclaimerBanner />
	<Navbar />
{/if}

<main>
	{@render children()}
</main>
