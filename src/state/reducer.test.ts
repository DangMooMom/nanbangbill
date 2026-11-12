import { describe, expect, it } from 'vitest';
import { planTotals } from '../lib/calc';
import { gbp } from '../lib/format';
import { initialState, reducer, type Action, type State } from './reducer';

const run = (state: State, ...actions: Action[]) => actions.reduce(reducer, state);

const withSamplePlan = () => run(initialState, { type: 'loadSample' }, { type: 'calculate' });

const total = (s: State) =>
  planTotals(s.baseline!.heaters.map((h) => ({ ...h, ...s.trial[h.id] })), s.baseline!.rate).cost;

const idOf = (s: State, location: string) => s.heaters.find((h) => h.location === location)!.id;

describe('main flow with sample data', () => {
  it('starts empty and cannot skip ahead', () => {
    expect(initialState.heaters).toEqual([]);
    expect(run(initialState, { type: 'go', screen: 'patterns' }).screen).toBe('heaters');
    expect(run(initialState, { type: 'go', screen: 'cost' }).screen).toBe('heaters');
    expect(run(initialState, { type: 'go', screen: 'revised' }).screen).toBe('heaters');
  });

  it('calculates the baseline and opens Cost analysis', () => {
    const s = withSamplePlan();
    expect(s.screen).toBe('cost');
    expect(gbp(total(s))).toBe('£54.11');
  });

  it('Living room 3 → 2 hours gives £46.61; reset restores £54.11 and the original usage', () => {
    let s = withSamplePlan();
    const living = idOf(s, 'Living room');
    s = run(s, { type: 'setTrial', id: living, patch: { hoursPerDay: 2 } });
    expect(gbp(total(s))).toBe('£46.61');
    // The baseline and the Heating patterns inputs are untouched by the trial.
    expect(s.baseline!.heaters.find((h) => h.id === living)!.hoursPerDay).toBe(3);
    expect(s.usage[living]).toEqual({ hours: '3', days: 7 });
    s = run(s, { type: 'resetTrial' });
    expect(gbp(total(s))).toBe('£54.11');
    expect(s.trial[living]).toEqual({ hoursPerDay: 3, daysPerWeek: 7 });
  });

  it('does not calculate while usage is missing', () => {
    const s = run(initialState, { type: 'addHeater', location: 'Hall', watts: 800, assumed: false }, { type: 'calculate' });
    expect(s.baseline).toBeNull();
  });

  it('uses 1,000 W only when the assumption is chosen', () => {
    const s = run(initialState, { type: 'addHeater', location: 'Hall', watts: 0, assumed: true });
    expect(s.heaters[0]).toMatchObject({ watts: 1000, assumed: true });
  });
});

describe('Revised routine', () => {
  it('opens once a baseline exists; changes to several heaters add up; Reset restores the baseline', () => {
    let s = run(withSamplePlan(), { type: 'go', screen: 'revised' });
    expect(s.screen).toBe('revised');
    const living = idOf(s, 'Living room');
    const bedroom = idOf(s, 'Bedroom');
    s = run(s, { type: 'setTrial', id: living, patch: { hoursPerDay: 2 } }, { type: 'setTrial', id: bedroom, patch: { hoursPerDay: 6 } });
    expect(gbp(total(s))).toBe('£39.11');
    s = run(s, { type: 'go', screen: 'cost' }, { type: 'go', screen: 'revised' });
    expect(gbp(total(s))).toBe('£39.11');
    s = run(s, { type: 'resetTrial' });
    expect(gbp(total(s))).toBe('£54.11');
    expect(s.trial[living]).toEqual({ hoursPerDay: 3, daysPerWeek: 7 });
    expect(s.trial[bedroom]).toEqual({ hoursPerDay: 8, daysPerWeek: 7 });
  });

  it('a real change while on the page clears results and returns to Heating patterns', () => {
    let s = run(withSamplePlan(), { type: 'go', screen: 'revised' });
    s = run(s, { type: 'setRateMode', mode: 'own' });
    expect(s.baseline).toBeNull();
    expect(s.screen).toBe('patterns');
  });
});

describe('trial changes keep the original usage', () => {
  it('returning to Heating patterns shows the original usage', () => {
    let s = withSamplePlan();
    const living = idOf(s, 'Living room');
    s = run(s, { type: 'setTrial', id: living, patch: { daysPerWeek: 3 } }, { type: 'go', screen: 'patterns' });
    expect(s.usage[living]).toEqual({ hours: '3', days: 7 });
    expect(s.baseline!.heaters.find((h) => h.id === living)).toMatchObject({ hoursPerDay: 3, daysPerWeek: 7 });
  });

  it('resetting one heater leaves the others’ trial changes', () => {
    let s = withSamplePlan();
    const living = idOf(s, 'Living room');
    const bedroom = idOf(s, 'Bedroom');
    s = run(
      s,
      { type: 'setTrial', id: living, patch: { hoursPerDay: 2 } },
      { type: 'setTrial', id: bedroom, patch: { daysPerWeek: 4 } },
      { type: 'resetHeater', id: living },
    );
    expect(s.trial[living]).toEqual({ hoursPerDay: 3, daysPerWeek: 7 });
    expect(s.trial[bedroom]).toEqual({ hoursPerDay: 8, daysPerWeek: 4 });
  });
});

describe('what is kept and what is cleared', () => {
  it('navigation keeps the trial', () => {
    let s = withSamplePlan();
    const living = idOf(s, 'Living room');
    s = run(
      s,
      { type: 'setTrial', id: living, patch: { hoursPerDay: 2 } },
      { type: 'go', screen: 'patterns' },
      { type: 'go', screen: 'heaters' },
      { type: 'go', screen: 'cost' },
    );
    expect(s.trial[living].hoursPerDay).toBe(2);
  });

  it.each<[string, (s: State) => Action]>([
    ['a usage change', (s) => ({ type: 'setHours', id: idOf(s, 'Bedroom'), hours: '6' })],
    ['a days change', (s) => ({ type: 'setDays', id: idOf(s, 'Bedroom'), days: 5 })],
    ['a rate change', () => ({ type: 'setRateMode', mode: 'own' })],
    ['a heater edit', (s) => ({ type: 'updateHeater', id: idOf(s, 'Bedroom'), location: 'Bedroom', watts: 750, assumed: false })],
    ['a deleted heater', (s) => ({ type: 'deleteHeater', id: idOf(s, 'Bedroom') })],
    ['a new heater', () => ({ type: 'addHeater', location: 'Hall', watts: 400, assumed: false })],
  ])('%s clears the baseline and trial', (_name, make) => {
    let s = withSamplePlan();
    s = run(s, { type: 'setTrial', id: idOf(s, 'Living room'), patch: { hoursPerDay: 2 } }, { type: 'go', screen: 'patterns' });
    s = reducer(s, make(s));
    expect(s.baseline).toBeNull();
    expect(s.trial).toEqual({});
  });

  it('retyping the same value is not a change', () => {
    let s = withSamplePlan();
    s = run(s, { type: 'setHours', id: idOf(s, 'Bedroom'), hours: '8.0' });
    expect(s.baseline).not.toBeNull();
    s = run(s, { type: 'updateHeater', id: idOf(s, 'Bedroom'), location: 'Bedroom', watts: 500, assumed: false });
    expect(s.baseline).not.toBeNull();
  });
});

describe('rate selection is independent of heater power', () => {
  const manual = (assumed: boolean) =>
    run(initialState, { type: 'addHeater', location: 'Hall', watts: assumed ? 0 : 800, assumed });

  it.each([true, false])('a manual heater (1,000 W assumption: %s) leaves the example rate selected', (assumed) => {
    expect(manual(assumed).rateMode).toBe('example');
  });

  it('an explicit own-rate choice survives navigation and loading the sample', () => {
    let s = run(
      manual(true),
      { type: 'setRateInput', value: '24.5' },
      { type: 'setRateMode', mode: 'own' },
      { type: 'go', screen: 'patterns' },
      { type: 'go', screen: 'heaters' },
      { type: 'go', screen: 'patterns' },
    );
    expect(s).toMatchObject({ rateMode: 'own', rateInput: '24.5' });
    s = run(s, { type: 'loadSample' });
    expect(s).toMatchObject({ rateMode: 'own', rateInput: '24.5' });
  });

  it('editing a heater’s power assumption does not change the rate choice', () => {
    let s = run(manual(false), { type: 'setRateInput', value: '30' }, { type: 'setRateMode', mode: 'own' });
    s = run(s, { type: 'updateHeater', id: s.heaters[0].id, location: 'Hall', watts: 0, assumed: true });
    expect(s).toMatchObject({ rateMode: 'own', rateInput: '30' });
  });
});
