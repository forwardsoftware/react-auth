import React, { FC, useCallback, useState } from 'react';
import type { DependencyList } from 'react';
import { useAuthClient } from './auth';

function useUserCredentials() {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  const updateUsername = useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => {
      setUsername(evt.target.value);
    },
    []
  );
  const updatePassword = useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => {
      setPassword(evt.target.value);
    },
    []
  );

  return {
    username,
    password,
    updateUsername,
    updatePassword,
  };
}

function useAsyncCallback<T extends (...args: never[]) => Promise<unknown>>(
  callback: T,
  deps: DependencyList
): [T, boolean] {
  const [isLoading, setLoading] = useState(false);

  const cb = useCallback(async (...argsx: never[]) => {
    setLoading(true);
    try {
      return await callback(...argsx);
    } finally {
      setLoading(false);
    }
  }, deps) as T;

  return [cb, isLoading];
}

const AppContent: FC = () => {
  const client = useAuthClient();
  const userCredentials = useUserCredentials();

  const [onLogin, isLoginLoading] = useAsyncCallback(
    () =>
      client.login({
        username: userCredentials.username,
        password: userCredentials.password,
      }),
    [client, userCredentials]
  );

  const [onLogout, isLogoutLoading] = useAsyncCallback(() => client.logout(), [
    client,
  ]);

  const [onRefreshTokens, tokenRefreshLoading] = useAsyncCallback(
    () => client.refresh(),
    [client]
  );

  return (
    <div>
      <p>Auth client ready? {String(client.isInitialized)}</p>
      <p>Auth client authenticated? {String(client.isAuthenticated)}</p>

      <div>
        <input
          type="username"
          value={userCredentials.username}
          onChange={userCredentials.updateUsername}
        />
        <input
          type="password"
          value={userCredentials.password}
          onChange={userCredentials.updatePassword}
        />
      </div>

      <div>
        <button
          onClick={onLogin}
          disabled={client.isAuthenticated || isLoginLoading}
        >
          Login
        </button>

        <button
          onClick={onLogout}
          disabled={!client.isAuthenticated || isLogoutLoading}
        >
          Logout
        </button>
      </div>

      {isLoginLoading ? <p>Login in progress..</p> : null}

      <p>Tokens:</p>
      <pre>{JSON.stringify(client.tokens ?? {}, null, 2)}</pre>

      {/* 
        use client.refresh() where you implement your API calls logic (eg. redux-saga, ....)
        check code in src/api/interceptors.ts and use APIClient to make call to API
      */}
      <button
        onClick={onRefreshTokens}
        disabled={!client.isAuthenticated || tokenRefreshLoading}
      >
        Refresh tokens
      </button>
    </div>
  );
};

export default AppContent;
