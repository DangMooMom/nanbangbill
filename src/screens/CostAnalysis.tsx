import type { Dispatch } from 'react';
import { gbp } from '../lib/format';
import type { Action } from '../state/reducer';
import type { Baseline, Usage } from '../types';
import { OriginalPlan } from './plan/OriginalPlan';
import { usePlan } from './plan/usePlan';

interface Props {
  baseline: Baseline;
  trial: Record<string, Usage>;
  dispatch: Dispatch<Action>;
}

/** Cost analysis: the read-only baseline. Trying changes happens on Revised routine. */
export function CostAnalysis({ baseline, trial, dispatch }: Props) {
  const plan = usePlan(baseline, trial);

  return (
    <main>
      <h1>Cost analysis</h1>
      <p className="lede">See what your heating costs now, and which heaters cost the most to run.</p>

      <OriginalPlan plan={plan} />

      <section className="card cta" aria-labelledby="cta-title">
        <div>
          <h2 id="cta-title">Try a different routine</h2>
          <p>
            {plan.base.cost > 0 ? (
              <>
                See how using your heaters for different hours or
                days would change your 30-day cost of <strong className="num">{gbp(plan.base.cost)}</strong>.
              </>
            ) : (
              'See how using your heaters for different hours or days would change your 30-day cost.'
            )}
          </p>
        </div>
        <button
          type="button"
          className="btn primary"
          data-testid="go-routine"
          onClick={() => dispatch({ type: 'go', screen: 'revised' })}
        >
          Revise my routine →
        </button>
      </section>

      <p className="foot">
        Estimate only. It assumes each heater draws its rated power for the hours entered, and doesn’t account for weather,
        insulation, thermostats or whether a pattern keeps you warm enough. Standing charges and other appliances aren’t included.
      </p>
    </main>
  );
}
