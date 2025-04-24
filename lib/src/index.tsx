import React, { createContext, PropsWithChildren, useContext, useEffect, useState } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

import type { BaseAuthClient } from './types';

/**
 * Props that can be passed to AuthProvider
 */
export type AuthProviderProps = PropsWithChildren<{
  /**
   * An optional component to display if AuthClient initialization failed.
   */
  ErrorComponent?: React.ReactNode;

  /**
   * An optional component to display while AuthClient instance is being initialized.
   */
  LoadingComponent?: React.ReactNode;
}>;

type AuthProviderState = {
  isAuthenticated: boolean;

  isInitialized: boolean;
};

type AuthContext<C extends BaseAuthClient> = AuthProviderState & {
  authClient: C;
};

export function createAuth<C extends BaseAuthClient>(authClient: C) {
  // Create a React context containing a BaseAuthClient instance.
  const authContext = createContext<AuthContext<C> | null>(null);

  // Create the React Context Provider for the BaseAuthClient instance.
  const AuthProvider: React.FC<AuthProviderProps> = ({
    children,
    ErrorComponent,
    LoadingComponent,
  }) => {
    const [isInitFailed, setInitFailed] = useState(false);
    const { isAuthenticated, isInitialized } = useSyncExternalStore(
      authClient.subscribe,
      authClient.getSnapshot
    );

    useEffect(() => {
      async function initAuthClient() {
        // Call init function
        const initSuccess = await authClient.init();
        setInitFailed(!initSuccess);
      }

      // Init AuthClient
      initAuthClient();
    }, []);

    if (!!ErrorComponent && isInitFailed) {
      return ErrorComponent;
    }

    if (!!LoadingComponent && !isInitialized) {
      return LoadingComponent;
    }

    return (
      <authContext.Provider
        value={{
          authClient,
          isAuthenticated,
          isInitialized,
        }}
      >
        {children}
      </authContext.Provider>
    );
  };

  // Retrieve the AuthClient from the current context
  const useAuthClient = function (): C {
    const ctx = useContext(authContext);

    if (!ctx) {
      throw new Error('useAuthClient hook should be used inside AuthProvider');
    }

    return ctx.authClient;
  };

  return {
    AuthProvider,
    useAuthClient,
  };
}

export { BaseAuthClient };
