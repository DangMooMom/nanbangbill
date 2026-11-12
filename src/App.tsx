import { useEffect, useReducer } from 'react';
import { Header } from './components/Header';
import { TooltipLayer } from './components/TooltipLayer';
import { CostAnalysis } from './screens/CostAnalysis';
import { MyHeaters } from './screens/MyHeaters';
import { HeatingPatterns } from './screens/HeatingPatterns';
import { RevisedRoutine } from './screens/RevisedRoutine';
import { initialState, reducer } from './state/reducer';

export function App() {
  // All state lives in memory only: a refresh or new tab starts empty, as the spec requires.
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [state.screen]);

  return (
    <div className="wrap">
      <Header state={state} dispatch={dispatch} />
      {state.screen === 'heaters' && <MyHeaters state={state} dispatch={dispatch} />}
      {state.screen === 'patterns' && <HeatingPatterns state={state} dispatch={dispatch} />}
      {state.screen === 'cost' && state.baseline && (
        <CostAnalysis baseline={state.baseline} trial={state.trial} dispatch={dispatch} />
      )}
      {state.screen === 'revised' && state.baseline && (
        <RevisedRoutine baseline={state.baseline} trial={state.trial} dispatch={dispatch} />
      )}
      <TooltipLayer />
    </div>
  );
}
