import { useEffect, useState } from 'react';

export function useStoredState<T>(key: string, initialize: () => T) {
  const [state, setState] = useState(initialize);
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // Practice remains available when browser storage is disabled.
    }
  }, [key, state]);
  return [state, setState] as const;
}
