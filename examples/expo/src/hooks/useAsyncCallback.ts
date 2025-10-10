import { DependencyList, useCallback, useState } from 'react';

export function useAsyncCallback<
  T extends (...args: never[]) => Promise<unknown>
>(callback: T, deps: DependencyList): [T, boolean] {
  const [isLoading, setLoading] = useState(false);

  const cb = useCallback(async (...argsx: never[]) => {
    setLoading(true);
    const res = await callback(...argsx);
    setLoading(false);
    return res;
  }, deps) as T;

  return [cb, isLoading];
}
