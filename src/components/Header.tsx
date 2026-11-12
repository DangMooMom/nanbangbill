import type { Dispatch } from 'react';
import type { Action, State } from '../state/reducer';
import type { Screen } from '../types';

const STEPS: { screen: Screen; label: string }[] = [
  { screen: 'heaters', label: 'My Heaters' },
  { screen: 'patterns', label: 'Heating patterns' },
  { screen: 'cost', label: 'Cost analysis' },
  { screen: 'revised', label: 'Revised routine' },
];

export function Header({ state, dispatch }: { state: State; dispatch: Dispatch<Action> }) {
  const canOpen = (screen: Screen) =>
    screen === 'heaters' ||
    (screen === 'patterns' && state.heaters.length > 0) ||
    ((screen === 'cost' || screen === 'revised') && !!state.baseline);

  return (
    <header className="top">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true" />
        Heatwise
      </div>
      <nav aria-label="Steps">
        <ol className="steps">
          {STEPS.map(({ screen, label }) => (
            <li key={screen}>
              <button
                type="button"
                className="step"
                aria-current={state.screen === screen ? 'page' : undefined}
                disabled={!canOpen(screen)}
                onClick={() => dispatch({ type: 'go', screen })}
              >
                {label}
              </button>
            </li>
          ))}
        </ol>
      </nav>
    </header>
  );
}
