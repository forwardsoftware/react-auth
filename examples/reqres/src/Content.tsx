import * as React from 'react';
import { useCallback, useState } from 'react';
import { DependencyList } from 'react';

import { useAuthClient } from './auth';

export const Content: React.FC = () => {
  const authClient = useAuthClient();
  const userCredentials = useUserCredentials();

  const [doRegister, isRegisterLoading] = useAsyncCallback(
    () =>
      authClient.register({
        email: userCredentials.email,
        password: userCredentials.password,
      }),
    [authClient, userCredentials]
  );


  const [doLogin, isLoginLoading] = useAsyncCallback(
    () => authClient.login(userCredentials),
    [authClient, userCredentials]
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
        <input
          type="email"
          value={userCredentials.email}
          onChange={userCredentials.updateEmail}
        />
        <input
          type="password"
          value={userCredentials.password}
          onChange={userCredentials.updatePassword}
        />
      </div>

      <div>
        <button
          onClick={doRegister}
          disabled={authClient.isAuthenticated || isRegisterLoading}
        >
          Register
        </button>

        <button
          onClick={doLogin}
          disabled={authClient.isAuthenticated || isLoginLoading}
        >
          Login
        </button>

        <button
          onClick={doLogout}
          disabled={!authClient.isAuthenticated || isLogoutLoading}
        >
          Logout
        </button>
      </div>

      {isRegisterLoading ? <p>Register in progress..</p> : null}
      {isLoginLoading ? <p>Login in progress..</p> : null}

      <p>Tokens:</p>
      <pre>{JSON.stringify(authClient.tokens ?? {}, null, 2)}</pre>
    </div>
  );
};

function useUserCredentials() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  const updateEmail = useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => {
      setEmail(evt.target.value);
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
    email,
    password,
    updateEmail,
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
    const res = await callback(...argsx);
    setLoading(false);
    return res;
  }, deps) as T;

  return [cb, isLoading];
}
