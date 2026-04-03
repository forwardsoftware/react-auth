import { useSyncExternalStore } from 'react';

import { useAuthClient } from '../auth';

export const AuthStatus = () => {
  const authClient = useAuthClient();
  const { isInitialized, isAuthenticated, tokens } = useSyncExternalStore(
    authClient.subscribe,
    authClient.getSnapshot,
  );

  return (
    <div className="card auth-status" data-testid="auth-status">
      <h2>Auth Status</h2>
      <div className="badges">
        <span
          className={`badge ${isInitialized ? 'badge-success' : 'badge-pending'}`}
          data-testid="initialized-badge"
        >
          Initialized: {String(isInitialized)}
        </span>
        <span
          className={`badge ${isAuthenticated ? 'badge-success' : 'badge-inactive'}`}
          data-testid="authenticated-badge"
        >
          Authenticated: {String(isAuthenticated)}
        </span>
      </div>
      <div className="token-display">
        <h3>Current Tokens</h3>
        <pre data-testid="token-display">{JSON.stringify(tokens, null, 2)}</pre>
      </div>
    </div>
  );
};
