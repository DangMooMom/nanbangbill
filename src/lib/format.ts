const gbpFmt = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' });

const isZero = (n: number) => Math.abs(n) < 0.005;

export const gbp = (n: number) => gbpFmt.format(isZero(n) ? 0 : n);

/** "−£7.50" / "+£3.21" / "£0.00" */
export const signedGbp = (n: number) => (isZero(n) ? '£0.00' : (n < 0 ? '−' : '+') + gbpFmt.format(Math.abs(n)));

/** Signed whole-number percentage; tiny non-zero changes read "<1%". */
export function signedPct(n: number): string {
  const a = Math.abs(n);
  if (a < 0.005) return '0%';
  if (a < 0.5) return '<1%';
  return (n < 0 ? '−' : '+') + a.toFixed(0) + '%';
}

export const share = (part: number, total: number) => Math.round((part / total) * 100) + '%';

export const num = (n: number, maxDecimals = 2) => n.toLocaleString('en-GB', { maximumFractionDigits: maxDecimals });

export const kwh = (n: number) =>
  n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' kWh';

export const hours = (n: number) => num(n) + ' h';

export const days = (n: number) => `${n} ${n === 1 ? 'day' : 'days'}`;

export const watts = (w: number, assumed = false) => `${num(w)} W${assumed ? ' (assumed)' : ''}`;

export const rate = (r: number) => `${num(r)}p per kWh`;

/** CSS colour for a heater's palette slot. */
export const heaterColour = (slot: number) => `var(--s${(slot % 8) + 1})`;
