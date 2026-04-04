import React, { useCallback, useState } from 'react';
import type { DependencyList } from 'react';

import { useAuthClient } from './auth';

export const Content: React.FC = () => {
  const authClient = useAuthClient();

  const [doLogin, isLoginLoading, loginError] = useAsyncCallback(() => authClient.login(), [
    authClient,
  ]);
  const [doRefresh, isRefreshLoading, refreshError] = useAsyncCallback(
    () => authClient.refresh(),
    [authClient]
  );
  const [doLogout, isLogoutLoading, logoutError] = useAsyncCallback(
    () => authClient.logout(),
    [authClient]
  );

  return (
    <div>
      <p>Auth client ready? {String(authClient.isInitialized)}</p>
      <p>Auth client authenticated? {String(authClient.isAuthenticated)}</p>

      <div>
        <button
          onClick={doLogin}
          disabled={authClient.isAuthenticated || isLoginLoading}
        >
          Login
        </button>

        <button
          onClick={doRefresh}
          disabled={!authClient.tokens.refreshToken || isRefreshLoading}
        >
          Refresh
        </button>

        <button
          onClick={doLogout}
          disabled={!authClient.isAuthenticated || isLogoutLoading}
        >
          Logout
        </button>
      </div>

      {isLoginLoading ? <p>Login in progress..</p> : null}
      {isRefreshLoading ? <p>Refresh in progress..</p> : null}

      {loginError != null ? <p role="alert">Login error: {loginError instanceof Error ? loginError.message : 'An error occurred'}</p> : null}
      {refreshError != null ? <p role="alert">Refresh error: {refreshError instanceof Error ? refreshError.message : 'An error occurred'}</p> : null}
      {logoutError != null ? <p role="alert">Logout error: {logoutError instanceof Error ? logoutError.message : 'An error occurred'}</p> : null}

      <p>Tokens:</p>
      <pre>{JSON.stringify(authClient.tokens, null, 2)}</pre>
    </div>
  );
};

type AsyncCallbackState = { isLoading: boolean; error: unknown };

function useAsyncCallback<T extends (...args: never[]) => Promise<unknown>>(
  callback: T,
  deps: DependencyList
): [(...args: Parameters<T>) => Promise<unknown>, boolean, unknown] {
  const [{ isLoading, error }, setState] = useState<AsyncCallbackState>({
    isLoading: false,
    error: null,
  });
  const cb = useCallback(async (...argsx: Parameters<T>) => {
    setState({ isLoading: true, error: null });
    try {
      const result = await callback(...argsx);
      setState({ isLoading: false, error: null });
      return result;
    } catch (err) {
      setState({ isLoading: false, error: err });
    }
  }, deps);

  return [cb, isLoading, error];
}
