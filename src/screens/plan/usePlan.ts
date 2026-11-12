import { useMemo } from 'react';
import { highestCostId, planTotals, type PlanTotals } from '../../lib/calc';
import { heaterColour } from '../../lib/format';
import type { Baseline, PlanHeater, Usage } from '../../types';

export interface PlanHeaterView {
  base: PlanHeater;
  trial: Usage;
  colour: string;
  baseCost: number;
  baseKwh: number;
  trialCost: number;
  trialKwh: number;
  changed: boolean;
}

export interface PlanView {
  rate: number;
  /** Heaters ranked by original cost, highest first. The order never changes while editing. */
  heaters: PlanHeaterView[];
  base: PlanTotals;
  revised: PlanTotals;
  topId: string | null;
  changed: boolean;
}

/** Everything Cost analysis and Revised routine show, derived from the baseline snapshot and the trial usage. */
export function usePlan(baseline: Baseline, trial: Record<string, Usage>): PlanView {
  return useMemo(() => {
    const { rate } = baseline;
    const trialHeaters = baseline.heaters.map((h) => ({ ...h, ...trial[h.id] }));
    const base = planTotals(baseline.heaters, rate);
    const revised = planTotals(trialHeaters, rate);

    const heaters = baseline.heaters
      .map((h, i): PlanHeaterView => {
        const t = trial[h.id] ?? h;
        return {
          base: h,
          trial: { hoursPerDay: t.hoursPerDay, daysPerWeek: t.daysPerWeek },
          colour: heaterColour(h.colour),
          baseCost: base.rows[i].cost,
          baseKwh: base.rows[i].kwh,
          trialCost: revised.rows[i].cost,
          trialKwh: revised.rows[i].kwh,
          changed: t.hoursPerDay !== h.hoursPerDay || t.daysPerWeek !== h.daysPerWeek,
        };
      })
      .sort((a, b) => b.baseCost - a.baseCost);

    return { rate, heaters, base, revised, topId: highestCostId(base.rows), changed: heaters.some((h) => h.changed) };
  }, [baseline, trial]);
}
