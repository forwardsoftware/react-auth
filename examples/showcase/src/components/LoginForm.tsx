import { useState } from 'react';

import { useAuthClient } from '../auth';
import { useAsyncCallback } from '../hooks/useAsyncCallback';
import { VALID_CREDENTIALS } from '../mock-auth-client';

export const LoginForm = () => {
  const authClient = useAuthClient();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [doLogin, isLoading, loginError] = useAsyncCallback(
    async () => {
      const success = await authClient.login({ username, password });
      if (!success) {
        throw new Error('Login failed. Please check your credentials.');
      }
    },
    [authClient, username, password],
  );

  const [doInvalidLogin, isInvalidLoading, invalidError] = useAsyncCallback(
    async () => {
      const success = await authClient.login({ username: 'wrong', password: 'wrong' });
      if (!success) {
        throw new Error('Login failed. Please check your credentials.');
      }
    },
    [authClient],
  );

  const displayError = loginError ?? invalidError;

  return (
    <div className="card login-form" data-testid="login-form">
      <h2>Login</h2>
      <div className="form-group">
        <label htmlFor="username">Username</label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter username"
          data-testid="username-input"
        />
      </div>
      <div className="form-group">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password"
          data-testid="password-input"
        />
      </div>
      <div className="button-group">
        <button onClick={doLogin} disabled={isLoading} data-testid="login-button">
          {isLoading ? 'Logging in…' : 'Login'}
        </button>
        <button
          onClick={doInvalidLogin}
          disabled={isInvalidLoading}
          data-testid="invalid-login-button"
        >
          {isInvalidLoading ? 'Trying…' : 'Try Invalid Credentials'}
        </button>
      </div>
      {displayError && (
        <p className="error-message" data-testid="login-error">
          {displayError.message}
        </p>
      )}
      <p className="hint">
        Valid credentials: <code>{VALID_CREDENTIALS.username}</code> /{' '}
        <code>{VALID_CREDENTIALS.password}</code>
      </p>
    </div>
  );
};
