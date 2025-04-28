import { createEventEmitter, Deferred, EventReceiver } from "./utils";
import type { EventKey } from "./utils";

type AuthTokens = {};

type AuthCredentials = {};

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

type SubscribeFn = () => void;

type UnsubscribeFn = () => boolean;

export interface AuthClient<T = AuthTokens, C = AuthCredentials> {
  onInit?(): Promise<T | null>;

  onPostInit?(): Promise<void>;

  onPreLogin?(): Promise<void>;

  onLogin(credentials?: C): Promise<T>;

  onPostLogin?(isSuccess: boolean): Promise<void>;

  onPreRefresh?(): Promise<void>;

  onRefresh?(minValidity?: number): Promise<T>;

  onPostRefresh?(isSuccess: boolean): Promise<void>;

  onPreLogout?(): Promise<void>;

  onLogout?(): Promise<void>;

  onPostLogout?(isSuccess: boolean): Promise<void>;
}

type AuthClientTokens<AC extends AuthClient> = Partial<ReturnType<AC["onLogin"]>>;

type AuthClientCredentials<AC extends AuthClient> = Parameters<AC["onLogin"]>;

type AuthClientState<AC extends AuthClient> = {
  isAuthenticated: boolean;

  isInitialized: boolean;

  tokens: AuthClientTokens<AC>;
};

export interface EnhancedAuthClient<AC extends AuthClient, E extends Error = Error> {
  // Getters
  readonly isInitialized: boolean;
  readonly isAuthenticated: boolean;
  readonly tokens: AuthClientTokens<AC>;

  // Public methods
  init(): Promise<boolean>;
  login(...params: AuthClientCredentials<AC>): Promise<boolean>;
  refresh(minValidity?: number): Promise<boolean>;
  logout(): Promise<void>;

  // Event handling
  on<K extends EventKey<AuthEventsMap<E>>>(eventName: K, listener: EventReceiver<AuthEventsMap<E>[K]>): void;
  off<K extends EventKey<AuthEventsMap<E>>>(eventName: K, listener: EventReceiver<AuthEventsMap<E>[K]>): void;

  // Subscription handling
  subscribe(subscription: SubscribeFn): UnsubscribeFn;
  getSnapshot(): AuthClientState<AC>;
}

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
        const tokens = (await authClient.onInit?.()) ?? {};

        this.setState({
          isInitialized: true,
          isAuthenticated: !!tokens,
          tokens,
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
        tokens = (await authClient.onRefresh?.(minValidity)) ?? {};
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
        } catch {}
      });
    }
  })();
}
