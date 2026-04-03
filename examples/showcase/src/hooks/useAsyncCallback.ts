import { useCallback, useState } from 'react';
import type { DependencyList } from 'react';

export function useAsyncCallback<T extends (...args: never[]) => Promise<unknown>>(
  callback: T,
  deps: DependencyList,
): [T, boolean, Error | null] {
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const wrappedCallback = useCallback(async (...args: never[]) => {
    setLoading(true);
    setError(null);
    try {
      const result = await callback(...args);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, deps) as T;

  return [wrappedCallback, isLoading, error];
}
