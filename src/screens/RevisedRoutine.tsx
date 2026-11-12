import { useRef, type Dispatch } from 'react';
import type { Action } from '../state/reducer';
import type { Baseline, Usage } from '../types';
import { HeaterRow } from './plan/HeaterRow';
import { RevisedSummary } from './plan/RevisedSummary';
import { usePlan } from './plan/usePlan';

interface Props {
  baseline: Baseline;
  trial: Record<string, Usage>;
  dispatch: Dispatch<Action>;
}

/** Revised routine: the Revised plan. Every heater can be adjusted; the baseline is never edited. */
export function RevisedRoutine({ baseline, trial, dispatch }: Props) {
  const plan = usePlan(baseline, trial);
  const revisedRef = useRef<HTMLElement>(null);
  const reset = () => dispatch({ type: 'resetTrial' });
  const maxCost = Math.max(0, ...plan.heaters.flatMap((h) => [h.baseCost, h.trialCost]));

  return (
    <main>
      <h1>Revised routine</h1>
      <p className="lede">Try different hours or days for any heater and see how your 30-day cost changes.</p>

      <section className="revised" ref={revisedRef} aria-labelledby="rev-title">
        <RevisedSummary plan={plan} sectionRef={revisedRef} onReset={reset} />

        <section className="card" aria-labelledby="rows-title">
          <div className="card-head rows-head">
            <h3 id="rows-title">Change usage by heater</h3>
            <button type="button" className="btn" data-testid="reset" disabled={!plan.changed} onClick={reset}>
              Revert
            </button>
          </div>
          <ul className="heaters">
            {plan.heaters.map((h, i) => (
              <HeaterRow
                key={h.base.id}
                heater={h}
                rank={i + 1}
                costsMost={h.base.id === plan.topId}
                maxCost={maxCost}
                revisedTotal={plan.revised.cost}
                onChange={(patch) => dispatch({ type: 'setTrial', id: h.base.id, patch })}
                onReset={() => dispatch({ type: 'resetHeater', id: h.base.id })}
              />
            ))}
          </ul>
        </section>
      </section>

      <div className="page-actions">
        <button type="button" className="btn" onClick={() => dispatch({ type: 'go', screen: 'cost' })}>
          ← Cost analysis
        </button>
      </div>

      <p className="foot">
        Estimate only. It assumes each heater draws its rated power for the hours entered, and doesn’t account for weather,
        insulation, thermostats or whether a pattern keeps you warm enough. Standing charges and other appliances aren’t included.
      </p>
    </main>
  );
}
