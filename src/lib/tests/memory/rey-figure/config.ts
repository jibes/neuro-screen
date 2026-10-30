import { t } from '$lib/i18n/index.js';
import type { ReyElement } from './types.js';

const i = t();

// 18 real elements (simplified, Rey-Osterrieth-like) + 18 distractors.
// Each recognition phase uses a disjoint half: 9 real + 9 distractors.
export const REY_ELEMENTS: ReyElement[] = [
  // Real elements (simplified geometric components)
  {
    id: 1,
    label: 'Large rectangle',
    svgPath: 'M 60 40 L 240 40 L 240 160 L 60 160 Z',
    isReal: true,
  },
  { id: 2, label: 'Horizontal midline', svgPath: 'M 60 100 L 240 100', isReal: true },
  { id: 3, label: 'Vertical midline', svgPath: 'M 150 40 L 150 160', isReal: true },
  { id: 4, label: 'Diagonal top left', svgPath: 'M 60 40 L 150 100', isReal: true },
  { id: 5, label: 'Diagonal top right', svgPath: 'M 240 40 L 150 100', isReal: true },
  {
    id: 6,
    label: 'Small rectangle left',
    svgPath: 'M 80 70 L 120 70 L 120 100 L 80 100 Z',
    isReal: true,
  },
  {
    id: 7,
    label: 'Circle right',
    svgPath: 'M 210 80 A 15 15 0 1 0 210 110 A 15 15 0 1 0 210 80',
    isReal: true,
  },
  { id: 8, label: 'Triangle top', svgPath: 'M 150 10 L 170 40 L 130 40 Z', isReal: true },
  { id: 9, label: 'Cross outside left', svgPath: 'M 30 90 L 60 90 M 45 75 L 45 105', isReal: true },
  {
    id: 10,
    label: 'Square bottom left',
    svgPath: 'M 70 130 L 90 130 L 90 150 L 70 150 Z',
    isReal: true,
  },
  {
    id: 11,
    label: 'Parallel lines right',
    svgPath: 'M 240 55 L 270 55 M 240 70 L 270 70 M 240 85 L 270 85',
    isReal: true,
  },
  { id: 12, label: 'Diagonal bottom left', svgPath: 'M 60 160 L 150 100', isReal: true },
  { id: 13, label: 'Diagonal bottom right', svgPath: 'M 240 160 L 150 100', isReal: true },
  {
    id: 14,
    label: 'Diamond bottom centre',
    svgPath: 'M 150 120 L 165 140 L 150 160 L 135 140 Z',
    isReal: true,
  },
  {
    id: 15,
    label: 'Wavy lines bottom',
    svgPath: 'M 170 140 Q 180 130 190 140 Q 200 150 210 140',
    isReal: true,
  },
  {
    id: 16,
    label: 'Dots top right',
    svgPath: 'M 255 45 L 256 45 M 265 45 L 266 45 M 260 55 L 261 55',
    isReal: true,
  },
  { id: 17, label: 'Arc bottom right', svgPath: 'M 240 130 Q 270 145 240 160', isReal: true },
  { id: 18, label: 'Vertical line left', svgPath: 'M 60 160 L 60 190', isReal: true },
  // Distractor elements (not in the original figure)
  {
    id: 19,
    label: 'Star top right',
    svgPath:
      'M 270 20 L 275 30 L 285 30 L 277 37 L 280 47 L 270 40 L 260 47 L 263 37 L 255 30 L 265 30 Z',
    isReal: false,
  },
  {
    id: 20,
    label: 'Spiral centre',
    svgPath: 'M 150 100 Q 155 95 160 100 Q 165 105 160 110 Q 155 115 150 110 Q 145 105 150 100',
    isReal: false,
  },
  {
    id: 21,
    label: 'Arrow right',
    svgPath: 'M 100 170 L 130 170 L 130 165 L 145 175 L 130 185 L 130 180 L 100 180 Z',
    isReal: false,
  },
  {
    id: 22,
    label: 'Double circle top left',
    svgPath:
      'M 30 40 A 10 10 0 1 0 30 60 A 10 10 0 1 0 30 40 M 30 45 A 5 5 0 1 0 30 55 A 5 5 0 1 0 30 45',
    isReal: false,
  },
  {
    id: 23,
    label: 'Zigzag bottom',
    svgPath: 'M 170 180 L 180 170 L 190 180 L 200 170 L 210 180',
    isReal: false,
  },
  {
    id: 24,
    label: 'Crescent right',
    svgPath: 'M 280 100 A 20 20 0 0 1 280 140 A 12 12 0 0 0 280 100',
    isReal: false,
  },
  { id: 25, label: 'Triangle bottom', svgPath: 'M 150 190 L 170 160 L 130 160 Z', isReal: false },
  {
    id: 26,
    label: 'Circle left',
    svgPath: 'M 90 115 A 12 12 0 1 0 90 139 A 12 12 0 1 0 90 115',
    isReal: false,
  },
  {
    id: 27,
    label: 'Small rectangle right',
    svgPath: 'M 180 110 L 220 110 L 220 140 L 180 140 Z',
    isReal: false,
  },
  { id: 28, label: 'Diagonal in left rectangle', svgPath: 'M 80 70 L 120 100', isReal: false },
  {
    id: 29,
    label: 'Parallel lines left',
    svgPath: 'M 30 120 L 60 120 M 30 135 L 60 135 M 30 150 L 60 150',
    isReal: false,
  },
  {
    id: 30,
    label: 'Cross outside right',
    svgPath: 'M 240 120 L 270 120 M 255 105 L 255 135',
    isReal: false,
  },
  { id: 31, label: 'Vertical line right', svgPath: 'M 240 160 L 240 190', isReal: false },
  {
    id: 32,
    label: 'Square top right',
    svgPath: 'M 200 50 L 220 50 L 220 70 L 200 70 Z',
    isReal: false,
  },
  {
    id: 33,
    label: 'Diamond top centre',
    svgPath: 'M 150 45 L 162 62 L 150 80 L 138 62 Z',
    isReal: false,
  },
  {
    id: 34,
    label: 'Wavy line top left',
    svgPath: 'M 80 55 Q 90 45 100 55 Q 110 65 120 55',
    isReal: false,
  },
  { id: 35, label: 'Arc top left', svgPath: 'M 60 40 Q 30 55 60 70', isReal: false },
  { id: 36, label: 'Horizontal line bottom', svgPath: 'M 60 180 L 240 180', isReal: false },
];

export const REY_FIGURE_CONFIG = {
  testId: 'rey-figure',
  testName: i.tests.reyFigure.name,
  instructions: i.tests.reyFigure.instructions,

  studyTimeMs: 30000,
  /** Retention interval between immediate and delayed recognition */
  delayMs: 60000,
  realElements: 18,
  distractorElements: 18,
  /** Items per recognition phase (half of each set) */
  realPerPhase: 9,
  distractorsPerPhase: 9,
} as const;
