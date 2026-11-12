import { MAX_DAYS, MAX_HOURS } from './calc';

export type Result<T = number> = { ok: true; value: T } | { ok: false; message: string };

const fail = (message: string): Result<never> => ({ ok: false, message });

/** Parses a plain decimal number. Returns null for empty input and NaN for anything else that isn't a number. */
export function parseNumber(raw: string): number | null {
  const s = raw.trim().replace(/,/g, '');
  if (s === '') return null;
  if (!/^(\d+\.?\d*|\.\d+)$/.test(s)) return NaN;
  return Number(s);
}

export function validateLocation(raw: string): Result<string> {
  const value = raw.trim();
  return value ? { ok: true, value } : fail('Enter where this heater is.');
}

export function validateWatts(raw: string): Result {
  const v = parseNumber(raw);
  if (v === null) return fail('Enter the rated power in watts, or choose the 1,000 W assumption.');
  if (!Number.isFinite(v) || v <= 0) return fail('Power must be a number greater than 0.');
  return { ok: true, value: v };
}

export function validateHours(raw: string): Result {
  const v = parseNumber(raw);
  if (v === null) return fail('Enter the hours. Use 0 if it isn’t used.');
  if (!Number.isFinite(v)) return fail('Hours must be a number, for example 4.5.');
  if (v > MAX_HOURS) return fail('Hours must be between 0 and 24.');
  return { ok: true, value: v };
}

export function validateDays(value: number | null): Result {
  if (value === null) return fail('Choose the days a week. Use 0 if it isn’t used.');
  if (!Number.isInteger(value) || value < 0 || value > MAX_DAYS) return fail('Days must be a whole number from 0 to 7.');
  return { ok: true, value };
}

export function validateRate(raw: string): Result {
  const v = parseNumber(raw);
  if (v === null) return fail('Enter your unit rate in pence per kWh, or use the example rate.');
  if (!Number.isFinite(v) || v <= 0) return fail('The unit rate must be a number greater than 0.');
  return { ok: true, value: v };
}
