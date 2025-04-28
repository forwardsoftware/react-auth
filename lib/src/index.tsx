import React, { createContext, useContext, useEffect, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

import { wrapAuthClient } from './auth';
import type { AuthClient, EnhancedAuthClient } from './auth';

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

type AuthContext<AC extends AuthClient, E extends Error> = AuthProviderState & {
  authClient: EnhancedAuthClient<AC, E>;
};

export function createAuth<AC extends AuthClient, E extends Error = Error>(authClient: AC) {
  // Create a React context containing an AuthClient instance.
  const authContext = createContext<AuthContext<AC, E> | null>(null);

  const enhancedAuthClient = wrapAuthClient(authClient);

  // Create the React Context Provider for the AuthClient instance.
  const AuthProvider: React.FC<AuthProviderProps> = ({ children, ErrorComponent, LoadingComponent }) => {
    const [isInitFailed, setInitFailed] = useState(false);
    const { isAuthenticated, isInitialized } = useSyncExternalStore(enhancedAuthClient.subscribe, enhancedAuthClient.getSnapshot);

    useEffect(() => {
      async function initAuthClient() {
        // Call init function
        const initSuccess = await enhancedAuthClient.init();
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
          authClient: enhancedAuthClient,
          isAuthenticated,
          isInitialized,
        }}
      >
        {children}
      </authContext.Provider>
    );
  };

  // Retrieve the AuthClient from the current context
  const useAuthClient = function (): EnhancedAuthClient<AC, E> {
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

export type { AuthClient };
