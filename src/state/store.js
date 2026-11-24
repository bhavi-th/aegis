import { useReducer, useMemo } from 'react';
import { engineReducer, initialState, deriveMetrics } from './engine';

export function useCommandEngine() {
  const [state, dispatch] = useReducer(engineReducer, undefined, initialState);

  const actions = useMemo(() => ({
    injectScenario: (id) => dispatch({ type: 'SCENARIO', id }),
    reset: () => dispatch({ type: 'RESET' }),
    select: (type, id) => dispatch({ type: 'SELECT', selected: type && id ? { type, id } : null }),
    acknowledge: (alertId) => dispatch({ type: 'ACKNOWLEDGE', alertId }),
    mitigate: (nodeId, playbook, alertId = null) => dispatch({ type: 'MITIGATE', nodeId, playbook, alertId }),
  }), []);

  const metrics = useMemo(() => deriveMetrics(state), [state]);

  return { state, metrics, ...actions };
}
