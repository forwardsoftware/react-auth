import { useCallback, useState } from 'react';

import { useAuthClient } from './auth';

export const Content: React.FC = () => {
  const authClient = useAuthClient();

  const [doLogin, isLoginLoading] = useAsyncCallback(() => authClient.login(), [
    authClient,
  ]);
  const [doRefresh, isRefreshLoading] = useAsyncCallback(
    () => authClient.refresh(),
    [authClient]
  );
  const [doLogout, isLogoutLoading] = useAsyncCallback(
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

      <p>Tokens:</p>
      <pre>{JSON.stringify(authClient.tokens, null, 2)}</pre>
    </div>
  );
};

function useAsyncCallback<T extends (...args: never[]) => Promise<unknown>>(
  callback: T,
  deps: React.DependencyList
): [T, boolean] {
  const [isLoading, setLoading] = useState(false);
  const cb = useCallback(async (...argsx: never[]) => {
    setLoading(true);
    const res = await callback(...argsx);
    setLoading(false);
    return res;
  }, deps) as T;

  return [cb, isLoading];
}
