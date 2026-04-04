import { useSyncExternalStore } from 'react';

import { useAuthClient } from '../auth';
import { useAsyncCallback } from '../hooks/useAsyncCallback';
import type { MockTokens } from '../mock-auth-client';

export const AuthenticatedView = () => {
  const authClient = useAuthClient();
  const { tokens } = useSyncExternalStore(
    authClient.subscribe,
    authClient.getSnapshot,
  );

  const [doRefresh, isRefreshing] = useAsyncCallback(
    () => authClient.refresh(),
    [authClient],
  );

  const [doLogout, isLoggingOut] = useAsyncCallback(
    () => authClient.logout(),
    [authClient],
  );

  const typedTokens = tokens as Partial<MockTokens>;
  const expiryDate = typedTokens.expiresAt
    ? new Date(typedTokens.expiresAt).toLocaleTimeString()
    : 'N/A';

  return (
    <div className="card authenticated-view" data-testid="authenticated-view">
      <h2>Welcome!</h2>
      <p>You are authenticated.</p>
      <p className="expiry-info" data-testid="token-expiry">
        Tokens expire at: <strong>{expiryDate}</strong>
      </p>
      <div className="button-group">
        <button onClick={doRefresh} disabled={isRefreshing} data-testid="refresh-button">
          {isRefreshing ? 'Refreshing…' : 'Refresh Tokens'}
        </button>
        <button onClick={doLogout} disabled={isLoggingOut} data-testid="logout-button">
          {isLoggingOut ? 'Logging out…' : 'Logout'}
        </button>
      </div>
    </div>
  );
};
