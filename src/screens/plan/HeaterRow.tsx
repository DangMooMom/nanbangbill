import type { CSSProperties } from 'react';
import { DayPicker } from '../../components/DayPicker';
import { NumberStepper } from '../../components/NumberStepper';
import { MAX_HOURS } from '../../lib/calc';
import { days, gbp, hours, watts } from '../../lib/format';
import { validateHours } from '../../lib/validate';
import type { Usage } from '../../types';
import { DeltaChip } from './DeltaChip';
import type { PlanHeaterView } from './usePlan';

interface Props {
  heater: PlanHeaterView;
  rank: number;
  costsMost: boolean;
  /** Longest bar across all rows, so bars are comparable between heaters. */
  maxCost: number;
  /** Revised plan total, shown beside the edit once this heater has changed. */
  revisedTotal: number;
  onChange: (patch: Partial<Usage>) => void;
  onReset: () => void;
}

/** One heater: its controls on the left, original vs revised cost right beside them. */
export function HeaterRow({ heater, rank, costsMost, maxCost, revisedTotal, onChange, onReset }: Props) {
  const { base, trial, baseCost, trialCost, changed } = heater;
  const width = (cost: number) => `${maxCost > 0 ? (cost / maxCost) * 100 : 0}%`;
  const hoursId = `plan-hours-${base.id}`;
  const daysLabel = `plan-days-${base.id}`;

  return (
    <li
      id={`plan-row-${base.id}`}
      className="hrow"
      style={{ '--c': heater.colour } as CSSProperties}
      data-testid={`row-${base.location}`}
    >
      <div className="hhead">
        <div className="name">
          <span className="rank">{rank}</span>
          <span className="sw" style={{ background: heater.colour }} />
          {base.location}
          {costsMost && <span className="tag">Costs the most</span>}
        </div>
        <div className="spec num">{watts(base.watts, base.assumed)}</div>
      </div>

      <div className="hbody">
        <div className="inputs">
          <div className="f-row">
            <label className="lbl" htmlFor={hoursId}>
              Hours a day
              <span className="orig num">Original: {hours(base.hoursPerDay)}</span>
            </label>
            <div className="ctl">
              <NumberStepper
                id={hoursId}
                value={trial.hoursPerDay}
                min={0}
                max={MAX_HOURS}
                step={0.5}
                validate={validateHours}
                onChange={(hoursPerDay) => onChange({ hoursPerDay })}
                decreaseLabel={`Fewer hours a day, ${base.location}`}
                increaseLabel={`More hours a day, ${base.location}`}
              />
            </div>
          </div>
          <div className="f-row">
            <span className="lbl" id={daysLabel}>
              Days a week
              <span className="orig num">Original: {days(base.daysPerWeek)}</span>
            </span>
            <DayPicker
              name={`plan-days-${base.id}`}
              value={trial.daysPerWeek}
              original={base.daysPerWeek}
              labelledBy={daysLabel}
              onChange={(daysPerWeek) => onChange({ daysPerWeek })}
            />
          </div>
        </div>

        <div className="cmp num" aria-live="polite">
          <div className="cmp-row o">
            <span className="k">Original</span>
            <div className="track">
              <div className="bar" style={{ width: width(baseCost) }} />
            </div>
            <span className="v">{gbp(baseCost)}</span>
          </div>
          <div className="cmp-row r">
            <span className="k">Revised</span>
            <div className="track">
              <div className="bar" style={{ width: width(trialCost) }} />
            </div>
            <span className="v" data-testid="row-revised">
              {gbp(trialCost)}
            </span>
          </div>
          <div className="cmp-foot">
            <DeltaChip delta={trialCost - baseCost} baseCost={baseCost} testId="row-delta" />
            <button type="button" className="btn link" disabled={!changed} onClick={onReset}>
              Reset
            </button>
          </div>
          {changed && (
            <div className="cmp-total" data-testid="row-total">
              Plan total now <strong>{gbp(revisedTotal)}</strong>
            </div>
          )}
        </div>
      </div>
    </li>
  );
}
