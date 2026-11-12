import type { UsageDraft } from '../types';

/** Sample data from the spec's acceptance criteria. Used with the 25p/kWh example rate. */
export const SAMPLE_HEATERS: { location: string; watts: number; usage: UsageDraft }[] = [
  { location: 'Living room', watts: 1000, usage: { hours: '3', days: 7 } },
  { location: 'Bedroom', watts: 500, usage: { hours: '8', days: 7 } },
  { location: 'Study room', watts: 500, usage: { hours: '1', days: 3 } },
];
