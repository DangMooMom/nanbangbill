import { useState } from 'react';
import { parseNumber, type Result } from '../lib/validate';

interface Props {
  id: string;
  value: number;
  min: number;
  max: number;
  step: number;
  validate: (raw: string) => Result;
  onChange: (value: number) => void;
  decreaseLabel: string;
  increaseLabel: string;
}

/**
 * − / number / + control. Valid input is reported immediately;
 * invalid input shows a message and leaves the last valid value in place.
 */
export function NumberStepper({ id, value, min, max, step, validate, onChange, decreaseLabel, increaseLabel }: Props) {
  const [draft, setDraft] = useState(String(value));
  const [error, setError] = useState('');
  const [synced, setSynced] = useState(value);

  // Follow changes made elsewhere (such as Reset) in the same render,
  // so the field never shows a stale number next to an updated total.
  if (value !== synced) {
    setSynced(value);
    if (parseNumber(draft) !== value) setDraft(String(value));
    setError('');
  }

  const type = (raw: string) => {
    setDraft(raw);
    const result = validate(raw);
    setError(result.ok ? '' : result.message);
    if (result.ok && result.value !== value) onChange(result.value);
  };

  const nudge = (direction: 1 | -1) => {
    const next = Math.min(max, Math.max(min, Math.round((value + direction * step) * 1e6) / 1e6));
    setDraft(String(next));
    setError('');
    if (next !== value) onChange(next);
  };

  return (
    <>
      <div className={'stepper' + (error ? ' invalid' : '')}>
        <button type="button" aria-label={decreaseLabel} disabled={value <= min} onClick={() => nudge(-1)}>
          −
        </button>
        <input
          id={id}
          inputMode="decimal"
          autoComplete="off"
          value={draft}
          aria-invalid={!!error}
          aria-describedby={`${id}-err`}
          onChange={(e) => type(e.target.value)}
          onBlur={() => !error && setDraft(String(value))}
        />
        <button type="button" aria-label={increaseLabel} disabled={value >= max} onClick={() => nudge(1)}>
          +
        </button>
      </div>
      <div className="err" id={`${id}-err`} role="alert">
        {error}
      </div>
    </>
  );
}
