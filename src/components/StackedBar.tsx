import { gbp } from '../lib/format';

export interface Segment {
  id: string;
  label: string;
  cost: number;
  colour: string;
}

interface Props {
  segments: Segment[];
  /** Cost that fills the full width. */
  scale: number;
  className?: string;
  /** When set, empty space up to `scale` is hatched and shows this tooltip. */
  gapTip?: (empty: number) => string;
  /** Extra tooltip text per segment, e.g. its share. */
  detail?: (segment: Segment) => string;
}

/** Horizontal bar split by heater. Only empty space is ever hatched; segments are solid. */
export function StackedBar({ segments, scale, className = 'stack', gapTip, detail }: Props) {
  const total = segments.reduce((s, x) => s + x.cost, 0);
  const empty = scale - total;
  const width = (cost: number) => `calc(${scale > 0 ? (cost / scale) * 100 : 0}% - 2px)`;

  return (
    <div className={className}>
      {segments
        .filter((s) => s.cost > 0)
        .map((s) => (
          <span
            key={s.id}
            style={{ flex: `0 0 ${width(s.cost)}`, backgroundColor: s.colour }}
            data-c={s.colour}
            data-tip={`${s.label} · ${gbp(s.cost)}${detail ? ' · ' + detail(s) : ''}`}
          />
        ))}
      {gapTip && empty >= 0.005 ? (
        <span className="gap" style={{ flex: `0 0 ${width(empty)}` }} data-tip={gapTip(empty)} />
      ) : (
        <span className="pad" style={{ flex: '1 1 auto' }} />
      )}
    </div>
  );
}
