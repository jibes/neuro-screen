/** Methods page text (source). References are language-independent, see src/lib/tests/methods.ts */
export interface MethodText {
  paradigm: string;
  procedure: string;
  measures: string[];
  deviations: string[];
}

export const methodsEn = {
  title: 'Methods',
  intro: 'Background, administration and limitations of the tests.',
  statusTitle: 'Validation status: experimental',
  statusText1:
    'All tests are based on established neuropsychological paradigms, but these implementations are not normed and not validated. There are no age- or education-based reference values; results are raw scores and cannot be classified as “impaired” or “normal”.',
  statusText2:
    'They are suitable for within-person comparisons over time (same device), for research with its own control group, and for teaching and demonstration – not for diagnosis.',
  generalTitle: 'General procedures',
  general: [
    {
      title: 'Timing.',
      text: 'Stimulus onset is synchronised with the display frame; responses are timed with event timestamps. Browser, display and input device still add delays of about 10–50 ms, so reaction times are only fully comparable on the same device. Touch or keyboard input is stored per trial.',
    },
    {
      title: 'Reaction-time cleaning.',
      text: (minRt: number, sd: number) =>
        `Responses below ${minRt} ms count as anticipations; then values beyond ±${sd} SD per condition are excluded. Means and medians of correct trials are reported, together with the number of excluded values.`,
    },
    {
      title: 'Signal detection.',
      text: 'd′ and c are computed with a log-linear correction so that hit rates of 0 or 1 do not produce infinite values.',
    },
    {
      title: 'Trial sequences.',
      text: 'Conditions are balanced; sequences are randomised under constraints (e.g. at most 3 trials of the same condition in a row). The WCST uses a fixed card order.',
    },
    {
      title: 'Data quality.',
      text: 'Near-chance performance, many omissions or anticipations, interruptions and touch input are stored as notes and shown with the results.',
    },
    {
      title: 'Language.',
      text: 'Verbal material (word lists, Stroop colour words, spoken digits) depends on the selected language; the language is stored with every run. Results from different languages are not comparable.',
    },
    {
      title: 'Privacy.',
      text: 'All data stays in the browser (IndexedDB); nothing is transmitted.',
    },
  ],
  testsTitle: 'Tests',
  procedure: 'Administration',
  measures: 'Measures',
  deviations: 'Deviations from the original / limitations',
  literature: 'References',
  generalLiterature: 'General references',
  tests: {
    'go-nogo': {
      paradigm: 'Go/No-Go task for response inhibition.',
      procedure:
        '60 trials (75 % Go, 25 % No-Go; at most 2 No-Go in a row), fixation 500 ms, stimulus 500 ms, response window 1500 ms from stimulus onset, ITI 800–1200 ms. Practice block (10 trials, feedback, ≥ 60 % correct).',
      measures: [
        'Commission errors (responses to No-Go) as the measure of inhibition',
        'Omissions, hit RT (M, Md, SD) after cleaning',
        'd′ and response bias c (signal detection, log-linear correction)',
      ],
      deviations: ['Coloured circles instead of letters or shapes; no norms.'],
    },
    flanker: {
      paradigm: 'Eriksen flanker task (arrow version) for interference control.',
      procedure:
        '80 trials (50 % congruent, 50 % incongruent, target direction balanced; at most 3 identical conditions or responses in a row), arrow-key responses, response window 1500 ms. Practice block with feedback.',
      measures: [
        'Flanker effect = RT incongruent − RT congruent (correct trials; mean and median)',
        'Errors per condition, missing responses',
      ],
      deviations: ['No neutral condition; no norms.'],
    },
    stroop: {
      paradigm: 'Colour-word interference (Stroop), computerised single-trial version.',
      procedure:
        '108 trials (36 each congruent, incongruent and neutral “XXXX”; inks and ink-word pairs fully balanced). No ink repetition on consecutive trials and no word naming the previous ink (controls response priming and negative priming); at most 3 identical conditions in a row. Key responses (D/F/J/K).',
      measures: [
        'Stroop effect (incongruent − congruent), interference (incongruent − neutral), facilitation (neutral − congruent)',
        'Means and medians of correct trials; errors per condition',
      ],
      deviations: [
        'Key presses instead of naming the colour (manual Stroop effects are smaller than vocal ones).',
        'No norms.',
      ],
    },
    cpt: {
      paradigm: 'Continuous Performance Test (CPT-X) for sustained attention.',
      procedure:
        '200 letters in 4 blocks of 50 (equal number of “X” targets per block, 20 %), presentation 250 ms, fixed pace (SOA ≈ 2 s regardless of responses).',
      measures: [
        'Omissions, commissions, d′, c',
        'Hit RT, intra-individual variability (CV)',
        'Performance over blocks (vigilance decrement): RT, omissions and commissions per block',
      ],
      deviations: ['Shorter than clinical CPTs (e.g. Conners CPT, 14 min); no norms.'],
    },
    'n-back': {
      paradigm: 'Verbal 2-back task for working-memory updating.',
      procedure:
        '60 consonants, 30 % targets, presentation 500 ms, fixed pace (SOA ≈ 3 s). Practice block with feedback.',
      measures: ['Hits, false alarms, d′', 'Hit RT (M, Md)'],
      deviations: ['Only one level (2-back); lure trials are not controlled; no norms.'],
    },
    'digit-span': {
      paradigm: 'Digit span forward and backward (verbal short-term and working memory).',
      procedure:
        'WAIS-IV procedure: 2 trials per length (forward 2–9, backward 2–8), discontinue when both trials of a length are wrong, 1 digit per second, spoken presentation (speech synthesis), no feedback on test trials. Practice trials before both parts.',
      measures: [
        'Longest correct span forward/backward',
        'Raw score = number of correct trials per direction',
      ],
      deviations: [
        'Own random sequences instead of the WAIS items; synthetic voice; typed instead of spoken responses.',
        'Visual presentation when no speech output is available (stored).',
        'No norms; WAIS norms do not apply.',
      ],
    },
    corsi: {
      paradigm: 'Corsi block-tapping (visuospatial working memory), forward and backward.',
      procedure:
        '9 blocks, sequences without repetition, 1 block per second, 2 trials per length from 2, discontinue after 2 errors at one length, no feedback on test trials. Practice trials before both parts.',
      measures: [
        'Block span forward/backward',
        'Total score = span × correct sequences (Kessels et al., 2000)',
      ],
      deviations: [
        'Own block layout instead of the original coordinates; screen instead of a wooden board; no norms.',
      ],
    },
    'symbol-digit': {
      paradigm: 'Symbol-digit coding (modelled on SDMT/DSST) for processing speed.',
      procedure:
        '10 untimed practice items with feedback, then 90 s; fixed mapping of 9 symbols to the digits 1–9.',
      measures: ['Number of correct items in 90 s', 'Errors, processing rate'],
      deviations: [
        'Own symbols; keyboard/keypad instead of written or spoken responses; no norms.',
      ],
    },
    'trail-making-a': {
      paradigm: 'Trail Making Test, part A (visual search, psychomotor speed).',
      procedure:
        'Sample with 8 circles, then connect 25 circles (1–25) by click or tap; errors are shown immediately.',
      measures: ['Completion time', 'Errors', 'Segment times'],
      deviations: [
        'Own layout; mouse/touch instead of a pen; norms of the paper version do not apply.',
      ],
    },
    'trail-making-b': {
      paradigm: 'Trail Making Test, part B (cognitive flexibility, set shifting).',
      procedure: 'Sample with 8 circles, then 25 circles alternating 1–A–2–B … 13.',
      measures: ['Completion time, errors', 'B − A and B/A (removes the motor speed of part A)'],
      deviations: ['As part A.'],
    },
    wcst: {
      paradigm: 'Wisconsin Card Sorting Test (rule learning, set shifting).',
      procedure:
        '4 key cards, 128 response cards (2 × all 64 combinations of colour, shape and number; same fixed order for every administration, including ambiguous cards). Rule order colour → shape → number, switch after 10 consecutive correct matches, stop after 6 categories or 128 cards.',
      measures: [
        'Categories, errors, perseverative responses and errors (Heaton rules incl. the sandwich rule, simplified)',
        'Conceptual level responses (runs of ≥ 3 correct), failure to maintain set, trials to first category',
      ],
      deviations: [
        'Own card order (the original order is copyrighted); simplified perseveration scoring.',
        'No norms; Heaton norms do not apply.',
      ],
    },
    tower: {
      paradigm: 'Tower of London (planning and problem solving).',
      procedure:
        '3 pegs (capacity 3/2/1), 3 discs, 10 problems with 1–7 minimum moves (verified by breadth-first search). The minimum is shown; a problem ends at the move limit or after 2 min.',
      measures: [
        'Problems solved in minimum moves',
        'Excess moves, planning time (to first move), execution time, rule violations',
      ],
      deviations: [
        'Own selection of problems; click control; no norms (TOL-DX norms do not apply).',
      ],
    },
    'word-list': {
      paradigm: 'Verbal learning and memory test modelled on the RAVLT/VLMT.',
      procedure:
        'List A (15 words; English: original RAVLT list A, German: translation) presented 5 × (spoken, 1 word / 2 s), each followed by free recall (60 s); then interference list B with recall; then recall of list A (A6). No performance feedback.',
      measures: [
        'Sum A1–A5, learning over trials (Σ − 5 × A1), learning slope',
        'Proactive (B/A1) and retroactive interference (A6/A5)',
        'Intrusions, primacy/recency',
      ],
      deviations: [
        'Synthetic voice, slower presentation (2 s instead of 1 s per word), typed instead of spoken responses.',
        'No norms; RAVLT/VLMT norms do not apply.',
      ],
    },
    'delayed-recall': {
      paradigm: 'Delayed recall and recognition of the word list (RAVLT trial A7 and recognition).',
      procedure:
        'At least 20 min after the word list (shorter delays are flagged): free recall of list A (90 s), then yes/no recognition of 45 words (15 from list A, 15 from list B, 15 semantically/phonologically similar new words).',
      measures: [
        'A7, retention A7/A5',
        'Recognition: hits, false positives (incl. source confusions with list B), hits − FP, d′',
      ],
      deviations: ['As the word list.'],
    },
    'rey-figure': {
      paradigm: 'Visual recognition of figure elements (modelled on the RCFT recognition trial).',
      procedure:
        '30 s to memorise a complex figure, then immediate yes/no recognition (9 figure elements, 9 new elements), 60 s break, delayed recognition with other elements (9 + 9).',
      measures: ['d′, hits and false positives (immediate and delayed)'],
      deviations: [
        'NOT the Rey-Osterrieth test: neither copying nor free reproduction, own simplified figure. Measures visual recognition only, not visuoconstruction.',
        'No norms.',
      ],
    },
  } satisfies Record<string, MethodText>,
};

export type MethodsCatalogue = typeof methodsEn;
