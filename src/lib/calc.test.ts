import { describe, expect, it } from 'vitest';
import { energyKwh, heaterCost, highestCostId, planTotals, runCost } from './calc';
import { gbp, kwh } from './format';
import { validateDays, validateHours, validateLocation, validateRate, validateWatts } from './validate';

const RATE = 25;
const living = { id: 'living', watts: 1000, hoursPerDay: 3, daysPerWeek: 7 };
const bedroom = { id: 'bedroom', watts: 500, hoursPerDay: 8, daysPerWeek: 7 };
const study = { id: 'study', watts: 500, hoursPerDay: 1, daysPerWeek: 3 };
const sample = [living, bedroom, study];

describe('30-day estimate (spec acceptance criteria)', () => {
  it('gives the sample baseline of £54.11 and 216.43 kWh', () => {
    const t = planTotals(sample, RATE);
    expect(gbp(t.cost)).toBe('£54.11');
    expect(kwh(t.kwh)).toBe('216.43 kWh');
  });

  it('finds Bedroom (£30.00) as the heater that costs the most', () => {
    const t = planTotals(sample, RATE);
    expect(highestCostId(t.rows)).toBe('bedroom');
    expect(gbp(t.rows[1].cost)).toBe('£30.00');
  });

  it('changes the total to £46.61 (a £7.50 saving) when Living room goes from 3 to 2 hours', () => {
    const base = planTotals(sample, RATE).cost;
    const revised = planTotals([{ ...living, hoursPerDay: 2 }, bedroom, study], RATE).cost;
    expect(gbp(revised)).toBe('£46.61');
    expect(gbp(base - revised)).toBe('£7.50');
  });

  it('follows the formula W ÷ 1,000 × hours × days × 30 ÷ 7', () => {
    expect(energyKwh(study)).toBeCloseTo((0.5 * 1 * 3 * 30) / 7, 10);
    expect(heaterCost(living, RATE)).toBeCloseTo(22.5, 10);
  });

  it('has no highest-cost heater when nothing costs anything', () => {
    const t = planTotals([{ ...living, hoursPerDay: 0 }], RATE);
    expect(t.cost).toBe(0);
    expect(highestCostId(t.rows)).toBeNull();
  });
});

describe('run-cost chart (cost of running for the same time)', () => {
  it('uses the selected rate: W ÷ 1,000 × hours × p/kWh ÷ 100', () => {
    expect(gbp(runCost(1000, 4, RATE))).toBe('£1.00');
    expect(gbp(runCost(500, 4, RATE))).toBe('£0.50');
    expect(gbp(runCost(1000, 24, 30))).toBe('£7.20');
    expect(runCost(1000, 1, 30)).toBeCloseTo(runCost(1000, 1, RATE) * (30 / RATE), 10);
  });

  it('is zero at 0 hours', () => {
    expect(runCost(2000, 0, RATE)).toBe(0);
  });
});

describe('several heaters changed together', () => {
  it('Living room 3 → 2 h and Bedroom 8 → 6 h add up to £39.11 (a £15.00 saving)', () => {
    const base = planTotals(sample, RATE).cost;
    const revised = planTotals([{ ...living, hoursPerDay: 2 }, { ...bedroom, hoursPerDay: 6 }, study], RATE).cost;
    expect(gbp(revised)).toBe('£39.11');
    expect(gbp(base - revised)).toBe('£15.00');
  });
});

describe('validation', () => {
  it('requires a location with more than whitespace', () => {
    expect(validateLocation('   ').ok).toBe(false);
    expect(validateLocation(' Hall ')).toEqual({ ok: true, value: 'Hall' });
  });
  it('requires power to be a finite positive number', () => {
    expect(validateWatts('1,500')).toEqual({ ok: true, value: 1500 });
    for (const bad of ['', '0', '-5', 'abc', 'Infinity', '1e3']) expect(validateWatts(bad).ok).toBe(false);
  });
  it('accepts any hours from 0 to 24 and keeps missing distinct from zero', () => {
    expect(validateHours('0')).toEqual({ ok: true, value: 0 });
    expect(validateHours('2.3')).toEqual({ ok: true, value: 2.3 });
    expect(validateHours('24').ok).toBe(true);
    for (const bad of ['', '24.5', '-1', 'two']) expect(validateHours(bad).ok).toBe(false);
  });
  it('requires days to be an integer from 0 to 7', () => {
    expect(validateDays(0).ok).toBe(true);
    expect(validateDays(7).ok).toBe(true);
    for (const bad of [null, 8, -1, 2.5]) expect(validateDays(bad).ok).toBe(false);
  });
  it('requires a positive unit rate', () => {
    expect(validateRate('24.5')).toEqual({ ok: true, value: 24.5 });
    for (const bad of ['', '0', 'x']) expect(validateRate(bad).ok).toBe(false);
  });
});
