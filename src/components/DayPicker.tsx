interface Props {
  /** Unique radio group name. */
  name: string;
  value: number | null;
  /** Marks the original value with a dot (Revised routine only). */
  original?: number;
  labelledBy: string;
  onChange: (days: number) => void;
}

const DAYS = [0, 1, 2, 3, 4, 5, 6, 7];

/** Days a week as 0–7 buttons. Nothing selected means "not entered yet". */
export function DayPicker({ name, value, original, labelledBy, onChange }: Props) {
  return (
    <div className="days" role="radiogroup" aria-labelledby={labelledBy}>
      {DAYS.map((d) => {
        const id = `${name}-${d}`;
        return (
          <span key={d} className="day">
            <input type="radio" id={id} name={name} value={d} checked={value === d} onChange={() => onChange(d)} />
            <label htmlFor={id} className={d === original ? 'was' : undefined} title={d === original ? 'Original' : undefined}>
              {d}
            </label>
          </span>
        );
      })}
    </div>
  );
}
