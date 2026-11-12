import type { Usage } from '../types';

export const PERIOD_DAYS = 30;
export const ASSUMED_WATTS = 1000;
export const EXAMPLE_RATE = 25; // p/kWh
export const MAX_HOURS = 24;
export const MAX_DAYS = 7;

type Powered = Usage & { watts: number };

/** 30-day energy (kWh) = W ÷ 1,000 × hours on a day of use × days a week × 30 ÷ 7 */
export function energyKwh(h: Powered): number {
  return (h.watts / 1000) * h.hoursPerDay * h.daysPerWeek * (PERIOD_DAYS / 7);
}

/** Cost (£) = energy × unit rate (p/kWh) ÷ 100. Never rounded here; round only for display. */
export function costGbp(kwh: number, rate: number): number {
  return (kwh * rate) / 100;
}

/** Cost (£) of running one heater for `hours` in a single stretch: W ÷ 1,000 × hours × p/kWh ÷ 100. */
export function runCost(watts: number, hours: number, rate: number): number {
  return costGbp((watts / 1000) * hours, rate);
}

export function heaterCost(h: Powered, rate: number): number {
  return costGbp(energyKwh(h), rate);
}

export interface PlanRow {
  id: string;
  kwh: number;
  cost: number;
}

export interface PlanTotals {
  rows: PlanRow[];
  kwh: number;
  cost: number;
}

export function planTotals(heaters: (Powered & { id: string })[], rate: number): PlanTotals {
  const rows = heaters.map((h) => {
    const kwh = energyKwh(h);
    return { id: h.id, kwh, cost: costGbp(kwh, rate) };
  });
  return {
    rows,
    kwh: rows.reduce((s, r) => s + r.kwh, 0),
    cost: rows.reduce((s, r) => s + r.cost, 0),
  };
}

/** Id of the heater that costs the most, or null when nothing costs anything. */
export function highestCostId(rows: PlanRow[]): string | null {
  let best: PlanRow | null = null;
  for (const r of rows) if (r.cost > 0 && (!best || r.cost > best.cost)) best = r;
  return best ? best.id : null;
}
