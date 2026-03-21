/**
 * Structured name returned by Apple Sign-In.
 * Apple only provides this on the first authorization.
 */
export type AppleFullName = {
  givenName?: string;
  familyName?: string;
  middleName?: string;
  namePrefix?: string;
  nameSuffix?: string;
  nickname?: string;
};

/**
 * Tokens returned by Apple Sign-In
 */
export type AppleAuthTokens = {
  identityToken: string;
  authorizationCode?: string;
  email?: string;
  fullName?: AppleFullName;
  /** Stable user identifier. Consistent across sessions for the same Apple ID + app. */
  user?: string;
  expiresAt?: number;
};

/**
 * Credentials passed to authClient.login() after an Apple Sign-In flow
 */
export type AppleAuthCredentials = {
  identityToken: string;
  authorizationCode?: string;
  email?: string;
  fullName?: AppleFullName;
  user?: string;
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
 * Scopes supported by Apple Sign-In.
 * Apple only supports 'name' and 'email'.
 */
export type AppleScope = 'name' | 'email';

/**
 * Base configuration shared by web and native adapters
 */
export type AppleAuthConfig = {
  /** Apple Services ID (web) or App Bundle ID context */
  clientId: string;
  scopes?: AppleScope[];
  persistTokens?: boolean;
  storage?: TokenStorage;
  storageKey?: string;
  /** Nonce to bind the identity token to a session and prevent replay attacks. */
  nonce?: string;
};

/**
 * Web-specific configuration (Sign in with Apple JS options)
 */
export type AppleWebAuthConfig = AppleAuthConfig & {
  /** Required redirect URI registered in Apple Developer Console */
  redirectURI: string;
  /** Use popup flow instead of redirect (default: false) */
  usePopup?: boolean;
  /** Opaque state value for CSRF protection */
  state?: string;
};

/**
 * React Native-specific configuration
 */
export type AppleNativeAuthConfig = Omit<AppleAuthConfig, 'storage'> & {
  /** Storage adapter is required on native (e.g., MMKV or AsyncStorage wrapper). */
  storage: TokenStorage;
  /**
   * Redirect URI for Android web-based Apple OAuth.
   * Apple uses response_mode=form_post, so a backend intermediary is needed
   * to convert the POST into a deep link redirect back to your app.
   */
  androidRedirectUri?: string;
};

export const DEFAULT_SCOPES: AppleScope[] = ['name', 'email'];
export const DEFAULT_STORAGE_KEY = '@react-auth/apple-tokens';
