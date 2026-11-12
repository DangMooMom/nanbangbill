import { useState, type Dispatch } from 'react';
import { DayPicker } from '../components/DayPicker';
import { EXAMPLE_RATE } from '../lib/calc';
import { heaterColour, watts } from '../lib/format';
import { validateDays, validateHours, validateRate } from '../lib/validate';
import { effectiveRate, validPlanHeaters, type Action, type State } from '../state/reducer';

export function HeatingPatterns({ state, dispatch }: { state: State; dispatch: Dispatch<Action> }) {
  // Errors appear after a field has been left, or for everything once the user tries to continue.
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const show = (key: string) => submitted || touched[key];
  const touch = (key: string) => setTouched((t) => ({ ...t, [key]: true }));

  const rateResult = validateRate(state.rateInput);
  const rateError = state.rateMode === 'own' && show('rate') && !rateResult.ok ? rateResult.message : '';
  const ready = validPlanHeaters(state) !== null && effectiveRate(state) !== null;

  const submit = () => {
    setSubmitted(true);
    if (ready) dispatch({ type: 'calculate' });
  };

  return (
    <main>
      <h1>Heating patterns</h1>
      <p className="lede">Tell us your electricity unit rate and how you use each heater now.</p>

      <section className="card pad" aria-labelledby="rate-title">
        <div className="card-title">
          <h2 id="rate-title">Unit rate</h2>
        </div>
        <div className="rate-options" role="radiogroup" aria-labelledby="rate-title">
          {/* Only the radio, its title or typing a rate selects "My unit rate". Clicking the rate box just focuses it. */}
          <div className={'option' + (state.rateMode === 'own' ? ' selected' : '')}>
            <input
              type="radio"
              id="rate-own"
              name="rate-mode"
              checked={state.rateMode === 'own'}
              onChange={() => dispatch({ type: 'setRateMode', mode: 'own' })}
            />
            <span className="option-body">
              <label htmlFor="rate-own" className="option-choice">
                <span className="option-title">My unit rate</span>
                <span className="option-note">From your bill or tariff, including VAT</span>
              </label>
              <label htmlFor="rate" className={'input unit' + (rateError ? ' invalid' : '')}>
                <input
                  id="rate"
                  inputMode="decimal"
                  autoComplete="off"
                  aria-label="My unit rate in pence per kWh"
                  aria-invalid={!!rateError}
                  aria-describedby="rate-err"
                  placeholder="e.g. 24.5"
                  value={state.rateInput}
                  onChange={(e) => {
                    // Typing a rate selects "My unit rate"; just tabbing through the field does not.
                    dispatch({ type: 'setRateInput', value: e.target.value });
                    dispatch({ type: 'setRateMode', mode: 'own' });
                  }}
                  onBlur={() => touch('rate')}
                />
                <span>p/kWh</span>
              </label>
              <span className="field-err" id="rate-err" role="alert">
                {rateError}
              </span>
            </span>
          </div>
          <label className={'option' + (state.rateMode === 'example' ? ' selected' : '')}>
            <input
              type="radio"
              name="rate-mode"
              data-testid="example-rate"
              checked={state.rateMode === 'example'}
              onChange={() => dispatch({ type: 'setRateMode', mode: 'example' })}
            />
            <span className="option-body">
              <span className="option-title">
                {EXAMPLE_RATE}p/kWh <span className="badge saved">Example</span>
              </span>
              <span className="option-note">For trying Heatwise. This is not your actual tariff.</span>
            </span>
          </label>
        </div>
      </section>

      <section className="card list-card" aria-labelledby="usage-title">
        <div className="card-head">
          <h3 id="usage-title">Current usage</h3>
        </div>
        <ul className="rows">
          {state.heaters.map((h) => {
            const draft = state.usage[h.id] ?? { hours: '', days: null };
            const hoursResult = validateHours(draft.hours);
            const daysResult = validateDays(draft.days);
            const hoursKey = `hours-${h.id}`;
            const daysKey = `days-${h.id}`;
            const hoursError = show(hoursKey) && !hoursResult.ok ? hoursResult.message : '';
            const daysError = show(daysKey) && !daysResult.ok ? daysResult.message : '';
            return (
              <li key={h.id} className="hrow usage-row">
                <div className="hhead">
                  <div className="name">
                    <span className="sw" style={{ background: heaterColour(h.colour) }} />
                    {h.location}
                  </div>
                  <div className="spec num">{watts(h.watts, h.assumed)}</div>
                </div>
                <div className="inputs">
                  <div className="f-row">
                    <label className="lbl" htmlFor={hoursKey}>
                      Hours a day
                      <span className="orig">0 to 24</span>
                    </label>
                    <div className="ctl">
                      <span className={'input unit narrow' + (hoursError ? ' invalid' : '')}>
                        <input
                          id={hoursKey}
                          inputMode="decimal"
                          autoComplete="off"
                          value={draft.hours}
                          aria-invalid={!!hoursError}
                          aria-describedby={`${hoursKey}-err`}
                          onChange={(e) => dispatch({ type: 'setHours', id: h.id, hours: e.target.value })}
                          onBlur={() => touch(hoursKey)}
                        />
                        <span>h</span>
                      </span>
                    </div>
                    <div className="err" id={`${hoursKey}-err`} role="alert">
                      {hoursError}
                    </div>
                  </div>
                  <div className="f-row">
                    <span className="lbl" id={`${daysKey}-label`}>
                      Days a week
                      <span className="orig">0 to 7</span>
                    </span>
                    <DayPicker
                      name={daysKey}
                      value={draft.days}
                      labelledBy={`${daysKey}-label`}
                      onChange={(days) => {
                        dispatch({ type: 'setDays', id: h.id, days });
                        touch(daysKey);
                      }}
                    />
                    <div className="err" role="alert">
                      {daysError}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="page-actions">
        <button type="button" className="btn" onClick={() => dispatch({ type: 'go', screen: 'heaters' })}>
          Back
        </button>
        <span className="hint" role="status">
          {submitted && !ready ? 'Fix the highlighted inputs to see your heating cost.' : ''}
        </span>
        <button type="button" className="btn primary" data-testid="calculate" onClick={submit}>
          See my heating cost
        </button>
      </div>
    </main>
  );
}
