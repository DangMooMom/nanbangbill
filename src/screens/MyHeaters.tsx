import { useState, type Dispatch, type SubmitEvent } from 'react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ASSUMED_WATTS } from '../lib/calc';
import { heaterColour, watts } from '../lib/format';
import { validateLocation, validateWatts } from '../lib/validate';
import type { Action, State } from '../state/reducer';
import type { Heater } from '../types';

interface FormValues {
  location: string;
  watts: number;
  assumed: boolean;
}

/** Add or edit one heater. Errors appear beside the input they belong to. */
function HeaterForm({
  idPrefix,
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  idPrefix: string;
  initial?: Heater;
  submitLabel: string;
  onSubmit: (values: FormValues) => void;
  onCancel?: () => void;
}) {
  const [location, setLocation] = useState(initial?.location ?? '');
  const [power, setPower] = useState(initial && !initial.assumed ? String(initial.watts) : '');
  const [assumed, setAssumed] = useState(initial?.assumed ?? false);
  const [submitted, setSubmitted] = useState(false);

  const locationResult = validateLocation(location);
  const powerResult = assumed ? ({ ok: true, value: ASSUMED_WATTS } as const) : validateWatts(power);
  const locationError = submitted && !locationResult.ok ? locationResult.message : '';
  const powerError = submitted && !powerResult.ok ? powerResult.message : '';

  const submit = (e: SubmitEvent) => {
    e.preventDefault();
    if (!locationResult.ok || !powerResult.ok) {
      setSubmitted(true);
      return;
    }
    onSubmit({ location: locationResult.value, watts: powerResult.value, assumed });
    if (!initial) {
      setLocation('');
      setPower('');
      setAssumed(false);
      setSubmitted(false);
    }
  };

  return (
    <form className="heater-form" onSubmit={submit} noValidate>
      <div className="field">
        <label htmlFor={`${idPrefix}-location`}>Location</label>
        <input
          id={`${idPrefix}-location`}
          className={'input' + (locationError ? ' invalid' : '')}
          value={location}
          placeholder="e.g. Living room"
          autoComplete="off"
          aria-invalid={!!locationError}
          aria-describedby={`${idPrefix}-location-err`}
          onChange={(e) => setLocation(e.target.value)}
        />
        <div className="field-err" id={`${idPrefix}-location-err`} role="alert">
          {locationError}
        </div>
      </div>

      <div className="field">
        <label htmlFor={`${idPrefix}-power`}>Rated input power</label>
        <div className={'input unit' + (powerError ? ' invalid' : '') + (assumed ? ' disabled' : '')}>
          <input
            id={`${idPrefix}-power`}
            inputMode="decimal"
            autoComplete="off"
            value={assumed ? '1,000' : power}
            disabled={assumed}
            placeholder="e.g. 1500"
            aria-invalid={!!powerError}
            aria-describedby={`${idPrefix}-power-err`}
            onChange={(e) => setPower(e.target.value)}
          />
          <span>W</span>
        </div>
        <label className="check">
          <input type="checkbox" checked={assumed} onChange={(e) => setAssumed(e.target.checked)} />
          I don’t know the power. Use the 1,000 W assumption
        </label>
        <div className="field-err" id={`${idPrefix}-power-err`} role="alert">
          {powerError}
        </div>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn primary">
          {submitLabel}
        </button>
        {onCancel && (
          <button type="button" className="btn" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

type Pending = { kind: 'delete'; heater: Heater } | { kind: 'sample' } | null;

export function MyHeaters({ state, dispatch }: { state: State; dispatch: Dispatch<Action> }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pending, setPending] = useState<Pending>(null);
  const { heaters } = state;

  const useSample = () => (heaters.length > 0 ? setPending({ kind: 'sample' }) : dispatch({ type: 'loadSample' }));

  return (
    <main>
      <h1>My Heaters</h1>
      <p className="lede">Add each electric heater you want to include.</p>

      <section className="card pad" aria-labelledby="add-title">
        <div className="card-title">
          <h2 id="add-title">Add a heater</h2>
          <button type="button" className="btn" data-testid="sample" onClick={useSample}>
            Try with sample data
          </button>
        </div>
        <HeaterForm idPrefix="add" submitLabel="Add heater" onSubmit={(v) => dispatch({ type: 'addHeater', ...v })} />
      </section>

      <section className="card list-card" aria-labelledby="list-title">
        <div className="card-head">
          <h3 id="list-title">Your heaters</h3>
          {heaters.length > 0 && <p>{heaters.length} registered</p>}
        </div>
        {heaters.length === 0 ? (
          <div className="empty">
            <p className="empty-title">No heaters yet</p>
            <p className="empty-body">Add one above, or use the sample data to try Heatwise with three example heaters.</p>
          </div>
        ) : (
          <ul className="rows">
            {heaters.map((h) =>
              editingId === h.id ? (
                <li key={h.id} className="row editing">
                  <HeaterForm
                    idPrefix={`edit-${h.id}`}
                    initial={h}
                    submitLabel="Save changes"
                    onSubmit={(v) => {
                      dispatch({ type: 'updateHeater', id: h.id, ...v });
                      setEditingId(null);
                    }}
                    onCancel={() => setEditingId(null)}
                  />
                </li>
              ) : (
                <li key={h.id} className="row">
                  <div className="name">
                    <span className="sw" style={{ background: heaterColour(h.colour) }} />
                    {h.location}
                  </div>
                  <div className="spec num">{watts(h.watts, h.assumed)}</div>
                  <div className="row-actions">
                    <button type="button" className="btn link" onClick={() => setEditingId(h.id)}>
                      Edit
                    </button>
                    <button type="button" className="btn link" onClick={() => setPending({ kind: 'delete', heater: h })}>
                      Delete
                    </button>
                  </div>
                </li>
              ),
            )}
          </ul>
        )}
      </section>

      <div className="page-actions">
        <button
          type="button"
          className="btn primary"
          data-testid="continue"
          disabled={heaters.length === 0}
          onClick={() => dispatch({ type: 'go', screen: 'patterns' })}
        >
          Continue
        </button>
      </div>

      {pending?.kind === 'delete' && (
        <ConfirmDialog
          title={`Delete ${pending.heater.location}?`}
          confirmLabel="Delete heater"
          onCancel={() => setPending(null)}
          onConfirm={() => {
            dispatch({ type: 'deleteHeater', id: pending.heater.id });
            setPending(null);
          }}
        >
          This removes the heater and its usage. Any heating cost results will need to be calculated again.
        </ConfirmDialog>
      )}
      {pending?.kind === 'sample' && (
        <ConfirmDialog
          title="Replace your heaters with sample data?"
          confirmLabel="Use sample data"
          onCancel={() => setPending(null)}
          onConfirm={() => {
            dispatch({ type: 'loadSample' });
            setEditingId(null);
            setPending(null);
          }}
        >
          Your {heaters.length === 1 ? 'heater' : `${heaters.length} heaters`}, usage and results will be replaced by three example
          heaters. Your unit rate choice stays as it is.
        </ConfirmDialog>
      )}
    </main>
  );
}
