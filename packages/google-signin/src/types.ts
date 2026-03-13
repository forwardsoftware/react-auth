/**
 * Tokens returned by Google Sign-In
 */
export type GoogleAuthTokens = {
  idToken: string;
  accessToken?: string;
  refreshToken?: string;
  serverAuthCode?: string;
  expiresAt?: number;
};

/**
 * Credentials passed to authClient.login() after a Google Sign-In flow
 */
export type GoogleAuthCredentials = {
  idToken: string;
  accessToken?: string;
  serverAuthCode?: string;
};

/**
 * Platform-agnostic storage interface for token persistence.
 * Compatible with localStorage (web), MMKV, and AsyncStorage (React Native).
 */
export interface TokenStorage {
  getItem(key: string): string | null | Promise<string | null>;
  setItem(key: string, value: string): void | Promise<void>;
  removeItem(key: string): void | Promise<void>;
}

/**
 * Base configuration shared by web and native adapters
 */
export type GoogleAuthConfig = {
  clientId: string;
  scopes?: string[];
  persistTokens?: boolean;
  storage?: TokenStorage;
  storageKey?: string;
};

/**
 * Web-specific configuration (Google Identity Services options)
 */
export type GoogleWebAuthConfig = GoogleAuthConfig & {
  ux_mode?: 'popup' | 'redirect';
  redirect_uri?: string;
  hosted_domain?: string;
  /** Nonce to bind the ID token to a session and prevent replay attacks. */
  nonce?: string;
};

/**
 * React Native-specific configuration
 */
export type GoogleNativeAuthConfig = Omit<GoogleAuthConfig, 'storage'> & {
  /** Storage adapter is required on native (e.g., MMKV or AsyncStorage wrapper). */
  storage: TokenStorage;
  iosClientId?: string;
  webClientId?: string;
  offlineAccess?: boolean;
};

export const DEFAULT_SCOPES = ['openid', 'profile', 'email'];
export const DEFAULT_STORAGE_KEY = '@react-auth/google-tokens';
