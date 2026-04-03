import { useSyncExternalStore } from 'react';

import { useAuthClient } from '../auth';
import { AuthenticatedView } from './AuthenticatedView';
import { AuthStatus } from './AuthStatus';
import { EventLog } from './EventLog';
import { LoginForm } from './LoginForm';

export const Dashboard = () => {
  const authClient = useAuthClient();
  const { isAuthenticated } = useSyncExternalStore(
    authClient.subscribe,
    authClient.getSnapshot,
  );

  return (
    <div className="dashboard">
      <h1>React Auth Showcase</h1>
      <AuthStatus />
      <div className="main-content">
        {isAuthenticated ? <AuthenticatedView /> : <LoginForm />}
      </div>
      <EventLog />
    </div>
  );
};
