import { RunCostChart } from '../../components/RunCostChart';
import { StackedBar } from '../../components/StackedBar';
import { PERIOD_DAYS } from '../../lib/calc';
import { days, gbp, hours, kwh, num, rate as formatRate, share } from '../../lib/format';
import type { PlanView } from './usePlan';

/** Read-only overview of the baseline. Rendered from the baseline only, so trials can never change it. */
export function OriginalPlan({ plan }: { plan: PlanView }) {
  const { heaters, base, topId } = plan;
  const hasCost = base.cost > 0;
  const top = heaters.find((h) => h.base.id === topId);

  const weekly = (h: (typeof heaters)[number]) => h.base.hoursPerDay * h.base.daysPerWeek;
  const byUse = [...heaters].sort((a, b) => weekly(b) - weekly(a));
  const maxUse = Math.max(...byUse.map(weekly), 0);

  return (
    <section className="original" aria-label="Your current heating cost">
      <div className="tiles num">
        <div className="card tile lead">
          <div className="k">Estimated 30-day cost</div>
          <div className="v" data-testid="baseline-cost">
            {gbp(base.cost)}
          </div>
          <div className="s">Heaters only</div>
        </div>
        <div className="card tile">
          <div className="k">Energy used</div>
          <div className="v" data-testid="baseline-kwh">
            {kwh(base.kwh)}
          </div>
          <div className="s">Over 30 days</div>
        </div>
        <div className="card tile">
          <div className="k">Average a day</div>
          <div className="v">{gbp(base.cost / PERIOD_DAYS)}</div>
          <div className="s">Across 30 days</div>
        </div>
      </div>
      <p className="caption num">
        {heaters.length} {heaters.length === 1 ? 'heater' : 'heaters'} · {formatRate(plan.rate)} · 30-day estimate · from your
        Heating patterns
      </p>

      <div className="card">
        <div className="card-head">
          <h2>Where the money goes</h2>
          <p>Cost and weekly use by heater</p>
        </div>
        <div className="breakdown">
          <div>
            <p className="callout" data-testid="callout">
              {hasCost && top ? (
                <>
                  <strong>{top.base.location}</strong> costs the most: <strong>{gbp(top.baseCost)}</strong>,{' '}
                  <strong>{share(top.baseCost, base.cost)}</strong> of your heating cost.
                </>
              ) : (
                'No running cost yet: every heater is set to 0 hours or 0 days. You can still try a different routine.'
              )}
            </p>
            {hasCost && (
              <>
                <StackedBar
                  className="bigstack"
                  scale={base.cost}
                  segments={heaters.map((h) => ({ id: h.base.id, label: h.base.location, cost: h.baseCost, colour: h.colour }))}
                  detail={(s) => share(s.cost, base.cost)}
                />
                <div className="seglabels num" aria-hidden="true">
                  {heaters
                    .filter((h) => h.baseCost > 0)
                    .map((h) => {
                      const width = (h.baseCost / base.cost) * 100;
                      return (
                        <span key={h.base.id} style={{ flex: `0 0 calc(${width}% - 2px)` }}>
                          {width >= 14 && (
                            <>
                              <b>{gbp(h.baseCost)}</b>
                              {share(h.baseCost, base.cost)}
                            </>
                          )}
                        </span>
                      );
                    })}
                </div>
              </>
            )}
            <ul className="legend">
              {heaters.map((h) => (
                <li key={h.base.id}>
                  <span className="sw" style={{ background: h.colour }} />
                  {h.base.location}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="callout sub">Ranked by weekly use</p>
            <ol className="rankbars num">
              {byUse.map((h) => {
                const w = weekly(h);
                return (
                  <li
                    key={h.base.id}
                    data-c={h.colour}
                    data-tip={`${h.base.location} · ${hours(w)} a week (${hours(h.base.hoursPerDay)} × ${days(h.base.daysPerWeek)})`}
                  >
                    <span className="nm">
                      <span className="sw" style={{ background: h.colour }} />
                      {h.base.location}
                    </span>
                    <span className="tr">
                      {w > 0 && <i style={{ width: `${(w / maxUse) * 100}%`, backgroundColor: h.colour }} />}
                    </span>
                    <span className="vl">
                      {hours(w)} <span>a week</span>
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </div>

      <RunCostChart heaters={heaters} rate={plan.rate} />

      <div className="card">
        <div className="card-head">
          <h2 id="table-title">Usage and cost table</h2>
          <p>30-day estimate</p>
        </div>
        <div className="tscroll">
          <table aria-labelledby="table-title">
            <thead>
              <tr>
                <th scope="col">Heater</th>
                <th scope="col">Power</th>
                <th scope="col">Hours a day</th>
                <th scope="col">Days a week</th>
                <th scope="col">kWh</th>
                <th scope="col">30-day cost</th>
                {hasCost && <th scope="col">Share</th>}
              </tr>
            </thead>
            <tbody>
              {heaters.map((h) => (
                <tr key={h.base.id}>
                  <td>{h.base.location}</td>
                  <td>
                    {num(h.base.watts)} W{h.base.assumed && <span className="assumed"> (assumed)</span>}
                  </td>
                  <td>{num(h.base.hoursPerDay)}</td>
                  <td>{h.base.daysPerWeek}</td>
                  <td>{num(h.baseKwh)}</td>
                  <td>{gbp(h.baseCost)}</td>
                  {hasCost && <td>{share(h.baseCost, base.cost)}</td>}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td>Total</td>
                <td />
                <td />
                <td />
                <td>{num(base.kwh)}</td>
                <td>{gbp(base.cost)}</td>
                {hasCost && <td>100%</td>}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </section>
  );
}
