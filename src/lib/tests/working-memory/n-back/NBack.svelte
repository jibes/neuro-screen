<script lang="ts">
  import { resolve } from '$app/paths';
  import { onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { t } from '$lib/i18n/index.js';
  import TestShell from '$lib/components/TestShell.svelte';
  import TouchResponsePad from '$lib/components/TouchResponsePad.svelte';
  import { isTouchDevice } from '$lib/core/device.js';
  import ResultsCard from '$lib/components/ResultsCard.svelte';
  import { createTrialRunner } from '$lib/core/trial-runner.svelte.js';
  import { NBACK_CONFIG } from './config.js';
  import { generateTrials, evaluateResponse, computeSummary } from './logic.js';
  import type { NBackTrial } from './types.js';
  import type { NBackSummary } from '$lib/db/models.js';
  import type { TrialConfig } from '$lib/core/trial-runner.svelte.js';
  import { saveRunToSession } from '$lib/db/session-store.svelte.js';
  import { getNextTest } from '$lib/tests/registry.js';

  const i = t();
  const touch = isTouchDevice();
  const config = NBACK_CONFIG;
  const nextTest = getNextTest(config.testId);

  const runner = createTrialRunner();
  let testShell = $state<TestShell>();
  let stage = $state<'practice' | 'transition' | 'test'>('practice');
  let summary = $state<NBackSummary | null>(null);
  let testTrials = $state<TrialConfig<NBackTrial>[]>([]);

  const currentStimulus = $derived(runner.currentStimulus as NBackTrial | null);

  function handleStart() {
    runTest();
  }

  async function runTest() {
    // Practice block with feedback; repeated until the accuracy threshold is met (max attempts)
    stage = 'practice';
    for (let attempt = 0; attempt < config.maxPracticeAttempts; attempt++) {
      const practice = await runner.run(
        generateTrials(config.practiceTrials, config.nLevel, config.targetRatio, true),
        evaluateResponse,
      );
      if (!practice) return;
      const accuracy = practice.filter((r) => r.correct).length / practice.length;
      if (accuracy >= config.practiceAccuracyThreshold) break;
    }
    stage = 'transition';
    await runner.timer.delay(3000);
    if (runner.destroyed) return;
    stage = 'test';

    testTrials = generateTrials(config.totalTrials, config.nLevel, config.targetRatio, false);
    const startedAt = new Date().toISOString();

    const results = await runner.run(testTrials, evaluateResponse);
    if (!results) return; // aborted (page left) — never save partial runs
    const durationMs = runner.timer.now();

    try {
      summary = computeSummary(results, testTrials);

      await saveRunToSession(
        {
          testId: config.testId,
          startedAt,
          completedAt: new Date().toISOString(),
          durationMs,
          config: { ...config, itiDuration: undefined },
          summary,
        },
        results.map((r, idx) => ({
          trialNumber: idx,
          phase: 'test',
          stimulus: testTrials[idx].stimulus as unknown as Record<string, unknown>,
          response: { key: r.responseKey },
          rt: r.rt,
          correct: r.correct,
          onsetTimestamp: r.stimulusOnset,
          responseTimestamp: r.responseTimestamp,
          customData: r.customData ?? {},
        })),
      );
    } catch (e) {
      console.error('Failed to save the test run:', e);
    } finally {
      testShell?.setPhase('completed');
    }
  }

  onDestroy(() => {
    runner.destroy();
  });
</script>

<TestShell
  bind:this={testShell}
  testName={config.testName}
  instructions={[...config.instructions]}
  touchHint={i.touch.singleButton}
  currentTrial={runner.currentTrial}
  totalTrials={runner.totalTrials}
  onStart={handleStart}
  onPauseChange={(p) => (p ? runner.pause() : runner.resume())}
>
  {#snippet children({ phase })}
    {#if phase === 'running' && stage === 'transition'}
      <div class="stimulus-area">
        <p class="text-xl text-slate-600">{i.common.practiceComplete}</p>
      </div>
    {:else if phase === 'running'}
      <TouchResponsePad buttons={[{ key: ' ', label: i.touch.tap, class: 'max-w-md' }]} />
      {#if stage === 'practice'}
        <div class="fixed top-4 left-4 text-sm font-medium text-amber-600">{i.common.practice}</div>
      {/if}
      <div class="stimulus-area">
        {#if runner.phase === 'stimulus' && currentStimulus}
          <span class="text-8xl font-light text-slate-900 select-none">
            {currentStimulus.letter}
          </span>
        {:else if runner.phase === 'feedback' && runner.lastOutcome}
          <span
            class="text-2xl font-medium {runner.lastOutcome.correct
              ? 'text-green-600'
              : 'text-red-600'}"
          >
            {runner.lastOutcome.correct ? i.common.correct : i.common.incorrect}
          </span>
        {:else}
          <span class="text-8xl font-light text-transparent select-none">X</span>
        {/if}
        <div
          class="absolute top-12 sm:top-4 inset-x-0 px-4 sm:px-32 text-center text-sm text-slate-400"
        >
          {i.tests.nBack.hint(config.nLevel, touch)}
        </div>
      </div>
    {:else if phase === 'completed' && summary}
      <ResultsCard
        testName={config.testName}
        {summary}
        onOverview={() => goto(resolve('/'))}
        onNext={nextTest ? () => goto(resolve(nextTest.path)) : undefined}
      />
    {/if}
  {/snippet}
</TestShell>
