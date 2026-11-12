import { ASSUMED_WATTS, EXAMPLE_RATE } from '../lib/calc';
import { SAMPLE_HEATERS } from '../lib/sample';
import { parseNumber, validateDays, validateHours, validateRate } from '../lib/validate';
import type { Baseline, Heater, PlanHeater, Screen, Usage, UsageDraft } from '../types';

export type RateMode = 'own' | 'example';

export interface State {
  screen: Screen;
  heaters: Heater[];
  usage: Record<string, UsageDraft>;
  rateMode: RateMode;
  rateInput: string;
  /** Set by "See my heating cost"; cleared when a heater, usage or the rate actually changes. */
  baseline: Baseline | null;
  /** Trial usage per heater. Starts equal to the baseline; the baseline itself is never edited. */
  trial: Record<string, Usage>;
}

export type Action =
  | { type: 'go'; screen: Screen }
  | { type: 'addHeater'; location: string; watts: number; assumed: boolean }
  | { type: 'updateHeater'; id: string; location: string; watts: number; assumed: boolean }
  | { type: 'deleteHeater'; id: string }
  | { type: 'loadSample' }
  | { type: 'setHours'; id: string; hours: string }
  | { type: 'setDays'; id: string; days: number | null }
  | { type: 'setRateMode'; mode: RateMode }
  | { type: 'setRateInput'; value: string }
  | { type: 'calculate' }
  | { type: 'setTrial'; id: string; patch: Partial<Usage> }
  | { type: 'resetHeater'; id: string }
  | { type: 'resetTrial' };

export const initialState: State = {
  screen: 'heaters',
  heaters: [],
  usage: {},
  // The example rate is the default until the user explicitly chooses or types their own rate.
  rateMode: 'example',
  rateInput: '',
  baseline: null,
  trial: {},
};

let nextId = 1;
const newId = () => `h${nextId++}`;

/** Smallest palette slot not already used, so a heater keeps its colour when others are deleted. */
function freeColour(heaters: Heater[]): number {
  const used = new Set(heaters.map((h) => h.colour));
  let slot = 0;
  while (used.has(slot) && slot < 8) slot++;
  return slot < 8 ? slot : heaters.length;
}

/** Drops the baseline results and the trial built on them. */
function clearResults(state: State): State {
  return {
    ...state,
    baseline: null,
    trial: {},
    screen: state.screen === 'cost' || state.screen === 'revised' ? 'patterns' : state.screen,
  };
}

/** The rate that would be used right now, or null if it isn't valid yet. */
export function effectiveRate(state: Pick<State, 'rateMode' | 'rateInput'>): number | null {
  if (state.rateMode === 'example') return EXAMPLE_RATE;
  const r = validateRate(state.rateInput);
  return r.ok ? r.value : null;
}

/** Heaters with validated usage, or null if anything is missing or invalid. */
export function validPlanHeaters(state: Pick<State, 'heaters' | 'usage'>): PlanHeater[] | null {
  const out: PlanHeater[] = [];
  for (const h of state.heaters) {
    const draft = state.usage[h.id] ?? { hours: '', days: null };
    const hours = validateHours(draft.hours);
    const days = validateDays(draft.days);
    if (!hours.ok || !days.ok) return null;
    out.push({ ...h, hoursPerDay: hours.value, daysPerWeek: days.value });
  }
  return out.length ? out : null;
}

/** Two drafts are the same value if they parse to the same number (so "3" → "3.0" is not a change). */
const sameNumber = (a: string, b: string) => {
  const x = parseNumber(a);
  const y = parseNumber(b);
  return x === y || (x !== null && y !== null && Number.isNaN(x) && Number.isNaN(y));
};

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'go':
      if (action.screen === 'patterns' && state.heaters.length === 0) return state;
      if ((action.screen === 'cost' || action.screen === 'revised') && !state.baseline) return state;
      return { ...state, screen: action.screen };

    case 'addHeater': {
      const heater: Heater = {
        id: newId(),
        location: action.location,
        watts: action.assumed ? ASSUMED_WATTS : action.watts,
        assumed: action.assumed,
        colour: freeColour(state.heaters),
      };
      return clearResults({
        ...state,
        heaters: [...state.heaters, heater],
        usage: { ...state.usage, [heater.id]: { hours: '', days: null } },
      });
    }

    case 'updateHeater': {
      const old = state.heaters.find((h) => h.id === action.id);
      if (!old) return state;
      const watts = action.assumed ? ASSUMED_WATTS : action.watts;
      if (old.location === action.location && old.watts === watts && old.assumed === action.assumed) return state;
      const heaters = state.heaters.map((h) =>
        h.id === action.id ? { ...h, location: action.location, watts, assumed: action.assumed } : h,
      );
      return clearResults({ ...state, heaters });
    }

    case 'deleteHeater': {
      const usage = { ...state.usage };
      delete usage[action.id];
      return clearResults({ ...state, heaters: state.heaters.filter((h) => h.id !== action.id), usage });
    }

    case 'loadSample': {
      const heaters: Heater[] = [];
      const usage: Record<string, UsageDraft> = {};
      SAMPLE_HEATERS.forEach((s, i) => {
        const id = newId();
        heaters.push({ id, location: s.location, watts: s.watts, assumed: false, colour: i });
        usage[id] = { ...s.usage };
      });
      // Heaters and usage only: the user's rate choice is independent and stays as it is.
      return clearResults({ ...state, heaters, usage });
    }

    case 'setHours': {
      const old = state.usage[action.id] ?? { hours: '', days: null };
      const next = { ...state, usage: { ...state.usage, [action.id]: { ...old, hours: action.hours } } };
      return sameNumber(old.hours, action.hours) ? next : clearResults(next);
    }

    case 'setDays': {
      const old = state.usage[action.id] ?? { hours: '', days: null };
      if (old.days === action.days) return state;
      return clearResults({ ...state, usage: { ...state.usage, [action.id]: { ...old, days: action.days } } });
    }

    case 'setRateMode': {
      if (state.rateMode === action.mode) return state;
      const next = { ...state, rateMode: action.mode };
      return effectiveRate(state) === effectiveRate(next) ? next : clearResults(next);
    }

    case 'setRateInput': {
      const next = { ...state, rateInput: action.value };
      return effectiveRate(state) === effectiveRate(next) ? next : clearResults(next);
    }

    case 'calculate': {
      // Inputs haven't changed since the last calculation: keep the trial.
      if (state.baseline) return { ...state, screen: 'cost' };
      const heaters = validPlanHeaters(state);
      const rate = effectiveRate(state);
      if (!heaters || rate === null) return state;
      const trial: Record<string, Usage> = {};
      heaters.forEach((h) => (trial[h.id] = { hoursPerDay: h.hoursPerDay, daysPerWeek: h.daysPerWeek }));
      return { ...state, baseline: { heaters, rate }, trial, screen: 'cost' };
    }

    case 'setTrial': {
      const current = state.trial[action.id];
      if (!state.baseline || !current) return state;
      return { ...state, trial: { ...state.trial, [action.id]: { ...current, ...action.patch } } };
    }

    case 'resetHeater': {
      const base = state.baseline?.heaters.find((h) => h.id === action.id);
      if (!base) return state;
      return {
        ...state,
        trial: { ...state.trial, [action.id]: { hoursPerDay: base.hoursPerDay, daysPerWeek: base.daysPerWeek } },
      };
    }

    case 'resetTrial': {
      if (!state.baseline) return state;
      const trial: Record<string, Usage> = {};
      state.baseline.heaters.forEach((h) => (trial[h.id] = { hoursPerDay: h.hoursPerDay, daysPerWeek: h.daysPerWeek }));
      return { ...state, trial };
    }
  }
}
