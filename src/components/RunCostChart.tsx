import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { MAX_HOURS, runCost } from '../lib/calc';
import { gbp, hours, num, signedGbp, watts as formatWatts } from '../lib/format';
import type { PlanHeaterView } from '../screens/plan/usePlan';

interface Props {
  heaters: PlanHeaterView[];
  /** p/kWh */
  rate: number;
}

const HEIGHT = 260;
const PAD = { top: 16, bottom: 30, left: 52 };
const STEP = 0.5;
const NARROW = 560;

/** A tidy axis maximum and tick step for a £ range. */
function niceScale(max: number): { top: number; step: number } {
  if (max <= 0) return { top: 1, step: 0.25 };
  const raw = max / 4;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? 10 * mag;
  return { top: Math.ceil(max / step) * step, step };
}

const axisGbp = (n: number) => (n < 1 && n > 0 ? `${num(n * 100, 1)}p` : gbp(n).replace(/\.00$/, ''));
/** Small amounts read better in pence: "12.5p", "£1.25". */
const perHour = (n: number) => (n < 1 ? `${num(n * 100, 1)}p` : gbp(n));

/**
 * Cost of running each heater for the same length of time, 0–24 hours, at the baseline rate.
 * Hover or use ←/→ to read every heater's cost at one time and how it compares with the cheapest.
 */
export function RunCostChart({ heaters, rate }: Props) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(720);
  const [t, setT] = useState<number | null>(null);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(280, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const narrow = width < NARROW;
  const padRight = narrow ? 14 : 168;
  const plotW = width - PAD.left - padRight;
  const plotH = HEIGHT - PAD.top - PAD.bottom;

  // Heaters with the same power cost the same per hour, so their lines coincide. Group them for labels.
  const groups = useMemo(() => {
    const map = new Map<number, PlanHeaterView[]>();
    for (const h of heaters) map.set(h.base.watts, [...(map.get(h.base.watts) ?? []), h]);
    return [...map.entries()].map(([w, hs]) => ({ watts: w, heaters: hs })).sort((a, b) => b.watts - a.watts);
  }, [heaters]);

  const maxCost = runCost(Math.max(0, ...heaters.map((h) => h.base.watts)), MAX_HOURS, rate);
  const { top, step } = niceScale(maxCost);
  const x = (hrs: number) => PAD.left + (hrs / MAX_HOURS) * plotW;
  const y = (cost: number) => PAD.top + plotH - (cost / top) * plotH;

  // End labels, nudged apart so close values stay readable.
  const endLabels = useMemo(() => {
    const out = groups.map((g) => ({ ...g, cost: runCost(g.watts, MAX_HOURS, rate), y: 0 }));
    let prev = -Infinity;
    for (const l of out) {
      l.y = Math.max(PAD.top + plotH - (l.cost / top) * plotH, prev + 30);
      prev = l.y;
    }
    return out;
  }, [groups, rate, top, plotH]);

  const readings = useMemo(() => {
    if (t === null) return [];
    const rows = heaters
      .map((h) => ({ h, cost: runCost(h.base.watts, t, rate) }))
      .sort((a, b) => b.cost - a.cost || a.h.base.location.localeCompare(b.h.base.location));
    const cheapest = Math.min(...rows.map((r) => r.cost));
    return rows.map((r) => ({ ...r, diff: r.cost - cheapest }));
  }, [heaters, rate, t]);
  const allSame = readings.length > 1 && readings.every((r) => Math.abs(r.diff) < 0.005);

  const timeAt = (clientX: number) => {
    const rect = boxRef.current!.getBoundingClientRect();
    const hrs = ((clientX - rect.left - PAD.left) / plotW) * MAX_HOURS;
    return Math.min(MAX_HOURS, Math.max(0, Math.round(hrs / STEP) * STEP));
  };
  const onMove = (e: PointerEvent) => setT(timeAt(e.clientX));
  const onKey = (e: KeyboardEvent) => {
    const cur = t ?? 4;
    const next =
      e.key === 'ArrowRight' ? cur + STEP : e.key === 'ArrowLeft' ? cur - STEP : e.key === 'Home' ? 0 : e.key === 'End' ? MAX_HOURS : null;
    if (next === null) return;
    e.preventDefault();
    setT(Math.min(MAX_HOURS, Math.max(0, next)));
  };

  const yTicks: number[] = [];
  for (let v = 0; v <= top + 1e-9; v += step) yTicks.push(v);
  const xTicks = [0, 4, 8, 12, 16, 20, 24];
  const panelLeft = t !== null && x(t) > width / 2;

  const describe = (r: (typeof readings)[number]) =>
    allSame ? 'same cost' : r.diff < 0.005 ? 'cheapest' : `${signedGbp(r.diff)} more than the cheapest`;

  return (
    <section className="card runchart" aria-labelledby="runchart-title">
      <div className="card-head">
        <h2 id="runchart-title">Cost to run each heater</h2>
      </div>

      <div
        className="rc-box"
        ref={boxRef}
        tabIndex={0}
        role="group"
        aria-label="Running cost chart. Use the left and right arrow keys to change the time."
        onPointerMove={onMove}
        onPointerDown={onMove}
        onPointerLeave={(e) => e.pointerType === 'mouse' && document.activeElement !== boxRef.current && setT(null)}
        onFocus={() => t === null && setT(4)}
        onBlur={() => setT(null)}
        onKeyDown={onKey}
      >
        <svg width={width} height={HEIGHT} aria-hidden="true" className="num">
          {yTicks.map((v) => (
            <g key={v}>
              <line className="rc-grid" x1={PAD.left} x2={PAD.left + plotW} y1={y(v)} y2={y(v)} />
              <text className="rc-tick" x={PAD.left - 8} y={y(v) + 4} textAnchor="end">
                {axisGbp(v)}
              </text>
            </g>
          ))}
          {xTicks.map((v) => (
            <text key={v} className="rc-tick" x={x(v)} y={HEIGHT - 8} textAnchor="middle">
              {v} h
            </text>
          ))}

          {groups.map((g) =>
            g.heaters.map((h, i) => (
              <line
                key={h.base.id}
                className="rc-line"
                x1={x(0)}
                y1={y(0)}
                x2={x(MAX_HOURS)}
                y2={y(runCost(g.watts, MAX_HOURS, rate))}
                style={{ stroke: h.colour, strokeDasharray: i === 0 ? undefined : `8 ${8 * i}`, strokeDashoffset: 8 * i }}
              />
            )),
          )}

          {!narrow &&
            endLabels.map((l) => (
              <g key={l.watts} transform={`translate(${PAD.left + plotW + 10}, ${l.y})`}>
                <text className="rc-end" y={-2}>
                  {l.heaters.map((h, i) => (
                    <tspan key={h.base.id} style={{ fill: 'var(--ink)' }}>
                      {i > 0 ? ', ' : ''}
                      {h.base.location}
                    </tspan>
                  ))}
                </text>
                <text className="rc-end sub" y={13}>
                  {gbp(l.cost)} for 24 h
                </text>
              </g>
            ))}

          {t !== null && (
            <g>
              <line className="rc-guide" x1={x(t)} x2={x(t)} y1={PAD.top} y2={PAD.top + plotH} />
              {groups.map((g) => (
                <circle
                  key={g.watts}
                  className="rc-dot"
                  cx={x(t)}
                  cy={y(runCost(g.watts, t, rate))}
                  r={4.5}
                  style={{ fill: g.heaters[0].colour }}
                />
              ))}
            </g>
          )}
        </svg>

        {t !== null && (
          <div
            className="rc-panel num"
            style={panelLeft ? { right: width - x(t) + 12 } : { left: x(t) + 12 }}
            data-testid="runchart-panel"
          >
            <div className="rc-panel-h">Running for {hours(t)}</div>
            <ul>
              {readings.map((r) => (
                <li key={r.h.base.id}>
                  <span className="sw" style={{ background: r.h.colour }} />
                  <span className="nm">{r.h.base.location}</span>
                  <b>{gbp(r.cost)}</b>
                  <span className={'df' + (r.diff >= 0.005 ? ' more' : '')}>
                    {allSame ? 'same' : r.diff < 0.005 ? 'cheapest' : `${signedGbp(r.diff)} more`}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <p className="sr-only" aria-live="polite">
        {t !== null &&
          `Running for ${hours(t)}: ` + readings.map((r) => `${r.h.base.location} ${gbp(r.cost)}, ${describe(r)}`).join('; ')}
      </p>

      <ul className="legend rc-legend num">
        {groups.flatMap((g) =>
          g.heaters.map((h) => (
            <li key={h.base.id}>
              <span className="sw" style={{ background: h.colour }} />
              {h.base.location}
              <span className="rc-meta">
                {formatWatts(h.base.watts, h.base.assumed)} · {perHour(runCost(h.base.watts, 1, rate))} an hour
              </span>
            </li>
          )),
        )}
      </ul>
      <p className="rc-note">
        Hover or tap the chart to compare. Heaters with the same power cost the same to run, so their lines overlap.
      </p>
    </section>
  );
}
