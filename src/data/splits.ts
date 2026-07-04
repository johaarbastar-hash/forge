import type { SplitTemplate } from '../types';

const REST = { label: 'Rest' } as const;

// SPEC §4.3 — day→exercise defaults are a starting point, editable later.
export const splitTemplates: SplitTemplate[] = [
  {
    id: 'split-ppl',
    name: 'Push / Pull / Legs (6-day)',
    daysPerWeek: 6,
    schedule: {
      mon: {
        label: 'Push',
        exerciseIds: [
          'ex-bench-press',
          'ex-incline-db-press',
          'ex-overhead-press',
          'ex-lateral-raise',
          'ex-tricep-pushdown',
          'ex-plank',
        ],
      },
      tue: {
        label: 'Pull',
        exerciseIds: [
          'ex-deadlift',
          'ex-lat-pulldown',
          'ex-barbell-row',
          'ex-face-pull',
          'ex-barbell-curl',
          'ex-hanging-knee-raise',
        ],
      },
      wed: {
        label: 'Legs',
        exerciseIds: [
          'ex-back-squat',
          'ex-leg-press',
          'ex-rdl',
          'ex-leg-extension',
          'ex-calf-raise',
          'ex-cable-crunch',
        ],
      },
      thu: {
        label: 'Push',
        exerciseIds: [
          'ex-overhead-press',
          'ex-incline-db-press',
          'ex-cable-fly',
          'ex-lateral-raise',
          'ex-overhead-tricep-ext',
          'ex-plank',
        ],
      },
      fri: {
        label: 'Pull',
        exerciseIds: [
          'ex-pull-up',
          'ex-seated-cable-row',
          'ex-barbell-row',
          'ex-face-pull',
          'ex-hammer-curl',
          'ex-russian-twist',
        ],
      },
      sat: {
        label: 'Legs',
        exerciseIds: [
          'ex-back-squat',
          'ex-hip-thrust',
          'ex-walking-lunge',
          'ex-seated-leg-curl',
          'ex-calf-raise',
          'ex-hanging-knee-raise',
        ],
      },
      sun: REST,
    },
  },
  {
    id: 'split-upper-lower',
    name: 'Upper / Lower (4-day)',
    daysPerWeek: 4,
    schedule: {
      mon: {
        label: 'Upper',
        exerciseIds: [
          'ex-bench-press',
          'ex-barbell-row',
          'ex-overhead-press',
          'ex-lat-pulldown',
          'ex-barbell-curl',
          'ex-tricep-pushdown',
        ],
      },
      tue: {
        label: 'Lower',
        exerciseIds: [
          'ex-back-squat',
          'ex-rdl',
          'ex-leg-press',
          'ex-seated-leg-curl',
          'ex-calf-raise',
          'ex-plank',
        ],
      },
      wed: REST,
      thu: {
        label: 'Upper',
        exerciseIds: [
          'ex-incline-db-press',
          'ex-seated-cable-row',
          'ex-pull-up',
          'ex-lateral-raise',
          'ex-hammer-curl',
          'ex-overhead-tricep-ext',
        ],
      },
      fri: {
        label: 'Lower',
        exerciseIds: [
          'ex-deadlift',
          'ex-hip-thrust',
          'ex-leg-extension',
          'ex-walking-lunge',
          'ex-calf-raise',
          'ex-cable-crunch',
        ],
      },
      sat: REST,
      sun: REST,
    },
  },
  {
    id: 'split-full-body',
    name: 'Full Body (3-day)',
    daysPerWeek: 3,
    schedule: {
      mon: {
        label: 'Full Body',
        exerciseIds: [
          'ex-back-squat',
          'ex-bench-press',
          'ex-barbell-row',
          'ex-overhead-press',
          'ex-rdl',
          'ex-plank',
        ],
      },
      tue: REST,
      wed: {
        label: 'Full Body',
        exerciseIds: [
          'ex-deadlift',
          'ex-incline-db-press',
          'ex-lat-pulldown',
          'ex-leg-press',
          'ex-barbell-curl',
          'ex-hanging-knee-raise',
        ],
      },
      thu: REST,
      fri: {
        label: 'Full Body',
        exerciseIds: [
          'ex-back-squat',
          'ex-overhead-press',
          'ex-pull-up',
          'ex-hip-thrust',
          'ex-tricep-pushdown',
          'ex-cable-crunch',
        ],
      },
      sat: REST,
      sun: REST,
    },
  },
];

export const DEFAULT_SPLIT_ID = 'split-ppl';

export function getSplitTemplate(id: string): SplitTemplate | undefined {
  return splitTemplates.find((s) => s.id === id);
}
