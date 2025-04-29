import React, { createContext, useContext, useEffect, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

import { createEventEmitter, Deferred, EventReceiver } from "./utils";
import type { EventKey } from "./utils";

/**
 * Represents authentication tokens used for API authorization
 */
type AuthTokens = {};

/**
 * Represents user credentials used for authentication
 */
type AuthCredentials = {};

/**
 * Maps authentication events to their corresponding payload types
 * @template E - The error type used throughout the authentication flow
 */
type AuthEventsMap<E extends Error> = {
  initSuccess: undefined;

  initFailed: E;

  loginStarted: undefined;

  loginSuccess: undefined;

  loginFailed: E;

  refreshStarted: undefined;

  refreshSuccess: undefined;

  refreshFailed: E;

  logoutStarted: undefined;

  logoutSuccess: undefined;

  logoutFailed: E;
};

/**
 * Function type for subscription callbacks
 */
type SubscribeFn = () => void;

/**
 * Function type for unsubscribing from events
 * @returns {boolean} - Returns true if the subscription was successfully removed
 */
type UnsubscribeFn = () => boolean;

/**
 * Interface defining the core authentication client functionality
 * @template T - The type of authentication tokens
 * @template C - The type of authentication credentials
 */
export interface AuthClient<T = AuthTokens, C = AuthCredentials> {
  /**
   * Optional initialization hook called before authentication
   * @returns {Promise<T | null>} - Returns authentication tokens if available
   */
  onInit?(): Promise<T | null>;

  /**
   * Optional post-initialization hook
   */
  onPostInit?(): Promise<void>;

  /**
   * Optional pre-login hook
   */
  onPreLogin?(): Promise<void>;

  /**
   * Handles the login process
   * @param {C} [credentials] - Optional credentials for authentication
   * @returns {Promise<T>} - Returns authentication tokens upon successful login
   */
  onLogin(credentials?: C): Promise<T>;

  /**
   * Optional post-login hook
   * @param {boolean} isSuccess - Indicates whether the login was successful
   */
  onPostLogin?(isSuccess: boolean): Promise<void>;

  /**
   * Optional pre-refresh hook
   */
  onPreRefresh?(): Promise<void>;

  /**
   * Optional token refresh handler
   * @param {number} [minValidity] - Minimum token validity period in seconds
   * @returns {Promise<T>} - Returns refreshed authentication tokens
   */
  onRefresh?(currentTokens: T, minValidity?: number): Promise<T>;

  /**
   * Optional post-refresh hook
   * @param {boolean} isSuccess - Indicates whether the token refresh was successful
   */
  onPostRefresh?(isSuccess: boolean): Promise<void>;

  /**
   * Optional pre-logout hook
   */
  onPreLogout?(): Promise<void>;

  /**
   * Optional logout handler
   */
  onLogout?(): Promise<void>;

  /**
   * Optional post-logout hook
   * @param {boolean} isSuccess - Indicates whether the logout was successful
   */
  onPostLogout?(isSuccess: boolean): Promise<void>;
}

/**
 * Extracts token type from an AuthClient implementation
 * @template AC - The AuthClient implementation type
 */
type AuthClientTokens<AC extends AuthClient> = Partial<Awaited<ReturnType<AC["onLogin"]>>>;

/**
 * Extracts credentials type from an AuthClient implementation
 * @template AC - The AuthClient implementation type
 */
type AuthClientCredentials<AC extends AuthClient> = Parameters<AC["onLogin"]>;

/**
 * Represents the current state of an AuthClient
 * @template AC - The AuthClient implementation type
 */
type AuthClientState<AC extends AuthClient> = {
  isAuthenticated: boolean;

  isInitialized: boolean;

  tokens: AuthClientTokens<AC>;
};

/**
 * Enhanced authentication client with additional functionality and state management
 * @template AC - The AuthClient implementation type
 * @template E - The error type used throughout the authentication flow
 */
interface EnhancedAuthClient<AC extends AuthClient, E extends Error = Error> {
  /**
   * Indicates whether the authentication client has been initialized
   * @readonly
   */
  readonly isInitialized: boolean;

  /**
   * Indicates whether the user is currently authenticated
   * @readonly
   */
  readonly isAuthenticated: boolean;

  /**
   * Current authentication tokens
   * @readonly
   */
  readonly tokens: AuthClientTokens<AC>;

  /**
   * Initializes the authentication client
   * @returns {Promise<boolean>} - Returns true if initialization was successful
   */
  init(): Promise<boolean>;

  /**
   * Attempts to authenticate the user with provided credentials
   * @param {...AuthClientCredentials<AC>} params - Authentication credentials
   * @returns {Promise<boolean>} - Returns true if login was successful
   */
  login(...params: AuthClientCredentials<AC>): Promise<boolean>;

  /**
   * Refreshes the authentication tokens
   * @param {number} [minValidity] - Minimum token validity period in seconds
   * @returns {Promise<boolean>} - Returns true if token refresh was successful
   */
  refresh(minValidity?: number): Promise<boolean>;

  /**
   * Logs out the current user
   * @returns {Promise<void>}
   */
  logout(): Promise<void>;

  /**
   * Registers an event listener for authentication events
   * @template K - The event key type
   * @param {K} eventName - The name of the event to listen for
   * @param {EventReceiver<AuthEventsMap<E>[K]>} listener - The event handler function
   */
  on<K extends EventKey<AuthEventsMap<E>>>(eventName: K, listener: EventReceiver<AuthEventsMap<E>[K]>): void;

  /**
   * Removes an event listener for authentication events
   * @template K - The event key type
   * @param {K} eventName - The name of the event to stop listening for
   * @param {EventReceiver<AuthEventsMap<E>[K]>} listener - The event handler function to remove
   */
  off<K extends EventKey<AuthEventsMap<E>>>(eventName: K, listener: EventReceiver<AuthEventsMap<E>[K]>): void;

  /**
   * Subscribes to authentication state changes
   * @param {SubscribeFn} subscription - The callback function to be called on state changes
   * @returns {UnsubscribeFn} - A function to unsubscribe from state changes
   */
  subscribe(subscription: SubscribeFn): UnsubscribeFn;

  /**
   * Gets the current authentication state
   * @returns {AuthClientState<AC>} - The current authentication state
   */
  getSnapshot(): AuthClientState<AC>;
}

/**
 * Wraps a basic AuthClient implementation with enhanced functionality
 * @template AC - The AuthClient implementation type
 * @template E - The error type used throughout the authentication flow
 * @param {AC} authClient - The base authentication client to enhance
 * @returns {EnhancedAuthClient<AC, E>} - An enhanced authentication client with additional features
 */
export function wrapAuthClient<AC extends AuthClient, E extends Error = Error>(authClient: AC): EnhancedAuthClient<AC> {
  return new (class implements EnhancedAuthClient<AC, E> {
    private _state: Readonly<AuthClientState<AC>> = {
      isAuthenticated: false,
      isInitialized: false,
      tokens: {},
    };

    // refresh queue - used to avoid concurrency issue during Token refresh
    private refreshQ: Array<Deferred<boolean>> = [];

    private eventEmitter = createEventEmitter<AuthEventsMap<E>>();

    private subscribers: Set<SubscribeFn> = new Set();

    //
    // Getters
    //

    public get isInitialized() {
      return this._state.isInitialized;
    }

    public get isAuthenticated() {
      return this._state.isAuthenticated;
    }

    public get tokens() {
      return this._state.tokens;
    }

    //
    // Public methods
    //

    public async init(): Promise<boolean> {
      try {
        const prevTokens = await authClient.onInit?.();

        this.setState({
          isInitialized: true,
          isAuthenticated: !!prevTokens,
          tokens: prevTokens || {},
        });

        this.emit("initSuccess", undefined);
      } catch (error) {
        this.setState({
          isInitialized: false,
        });

        this.emit("initFailed", error as E);
      }

      await authClient.onPostInit?.();

      return this.isInitialized;
    }

    public async login(...params: AuthClientCredentials<AC>): Promise<boolean> {
      this.emit("loginStarted", undefined);

      await authClient.onPreLogin?.();

      let isSuccess: boolean = false;

      try {
        const tokens = await authClient.onLogin(params);

        this.setState({
          isAuthenticated: !!tokens,
          tokens,
        });

        this.emit("loginSuccess", undefined);

        isSuccess = true;
      } catch (err) {
        this.setState({
          isAuthenticated: false,
          tokens: {},
        });

        this.emit("loginFailed", err as E);

        isSuccess = false;
      }

      await authClient.onPostLogin?.(isSuccess);

      return this.isAuthenticated;
    }

    public async refresh(minValidity?: number): Promise<boolean> {
      const deferred = new Deferred<boolean>();

      this.runRefresh(deferred, minValidity);

      return deferred.getPromise();
    }

    public async logout(): Promise<void> {
      this.emit("logoutStarted", undefined);

      await authClient.onPreLogout?.();

      let isSuccess: boolean = false;

      try {
        await authClient.onLogout?.();

        this.setState({
          isAuthenticated: false,
          tokens: {},
        });

        this.emit("logoutSuccess", undefined);

        isSuccess = true;
      } catch (err) {
        this.emit("logoutFailed", err as E);

        isSuccess = false;
      }

      await authClient.onPostLogout?.(isSuccess);
    }

    public on<K extends EventKey<AuthEventsMap<E>>>(eventName: K, listener: EventReceiver<AuthEventsMap<E>[K]>): void {
      this.eventEmitter.on(eventName, listener);
    }

    public off<K extends EventKey<AuthEventsMap<E>>>(eventName: K, listener: EventReceiver<AuthEventsMap<E>[K]>): void {
      this.eventEmitter.off(eventName, listener);
    }

    // Should be declared like this to avoid binding issues when used by useSyncExternalStore
    public subscribe = (subscription: SubscribeFn): UnsubscribeFn => {
      this.subscribers.add(subscription);

      return () => this.subscribers.delete(subscription);
    };

    // Should be declared like this to avoid binding issues when used by useSyncExternalStore
    public getSnapshot = (): AuthClientState<AC> => {
      return this._state;
    };

    //
    // Private methods
    //

    private setState(stateUpdate: Partial<AuthClientState<AC>>): void {
      this._state = {
        ...this._state,
        ...stateUpdate,
      };

      this.notifySubscribers();
    }

    private async runRefresh(deferred: Deferred<boolean>, minValidity?: number): Promise<void> {
      // Add deferred Promise to refresh queue
      this.refreshQ.push(deferred);

      // If refresh queue already has promises enqueued do not attempt a new refresh - one is already in progress
      if (this.refreshQ.length !== 1) {
        return;
      }

      this.emit("refreshStarted", undefined);

      await authClient.onPreRefresh?.();

      let isAuthenticated: boolean = false;
      let tokens: AuthClientTokens<AC> = {};

      try {
        tokens = (await authClient.onRefresh?.(this.tokens, minValidity)) ?? {};
        isAuthenticated = true;

        this.emit("refreshSuccess", undefined);
      } catch (err) {
        isAuthenticated = false;

        this.emit("refreshFailed", err as E);
      }

      this.setState({
        isAuthenticated,
        tokens,
      });

      await authClient.onPostRefresh?.(isAuthenticated);

      for (let p = this.refreshQ.pop(); p != null; p = this.refreshQ.pop()) {
        p.resolve(isAuthenticated);
      }
    }

    private emit<K extends EventKey<AuthEventsMap<E>>>(eventName: K, error: AuthEventsMap<E>[K]): void {
      this.eventEmitter.emit(eventName, error);
    }

    private notifySubscribers() {
      this.subscribers.forEach((s) => {
        try {
          s();
        } catch { }
      });
    }
  })();
}

/**
 * Represents the current state of the authentication provider
 */
type AuthProviderState = {
  isAuthenticated: boolean;
  isInitialized: boolean;
};

/**
 * The authentication context containing both the state and the enhanced auth client
 * @template AC - The AuthClient implementation type
 * @template E - The error type used throughout the authentication flow
 */
type AuthContext<AC extends AuthClient, E extends Error> = AuthProviderState & {
  authClient: EnhancedAuthClient<AC, E>;
};

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

/**
 * Creates an authentication context and provider for a React application
 * @template AC - The AuthClient implementation type
 * @template E - The error type used throughout the authentication flow
 * @param authClient - The base authentication client to use
 * @returns An object containing the AuthProvider component and useAuthClient hook
 */
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

  /**
   * Hook to access the authentication client within the AuthProvider
   * @throws Error if used outside of an AuthProvider
   */
  const useAuthClient = function (): EnhancedAuthClient<AC, E> {
    const ctx = useContext(authContext);
    if (!ctx) {
      throw new Error('useAuthClient hook should be used inside AuthProvider');
    }

    return ctx.authClient;
  };

  return {
    AuthProvider,
    authClient: enhancedAuthClient,
    useAuthClient,
  };
}