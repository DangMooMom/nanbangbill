export type Screen = 'heaters' | 'patterns' | 'cost' | 'revised';

/** One physical heater, registered on My Heaters. */
export interface Heater {
  id: string;
  location: string;
  /** Rated input power in W. 1,000 when `assumed` is true. */
  watts: number;
  /** True only when the user explicitly chose the 1,000 W assumption. */
  assumed: boolean;
  /** Index into the heater colour palette; stays with the heater. */
  colour: number;
}

/** Usage as typed on Heating patterns. Empty/null means "not entered", which is distinct from 0. */
export interface UsageDraft {
  hours: string;
  days: number | null;
}

export interface Usage {
  hoursPerDay: number;
  daysPerWeek: number;
}

export type PlanHeater = Heater & Usage;

/** Snapshot taken by "See my heating cost". Never edited by trials. */
export interface Baseline {
  heaters: PlanHeater[];
  /** p/kWh */
  rate: number;
}
