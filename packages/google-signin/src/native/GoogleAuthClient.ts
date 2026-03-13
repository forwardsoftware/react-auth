import type { AuthClient } from '@forward-software/react-auth';
import type {
  GoogleAuthCredentials,
  GoogleAuthTokens,
  GoogleNativeAuthConfig,
  TokenStorage,
} from '../types';
import { DEFAULT_SCOPES, DEFAULT_STORAGE_KEY } from '../types';
import * as GoogleSignInModule from './GoogleSignInModule';

export class GoogleAuthClient implements AuthClient<GoogleAuthTokens, GoogleAuthCredentials> {
  private config: GoogleNativeAuthConfig;
  private storage: TokenStorage;
  private storageKey: string;
  private configured = false;

  constructor(config: GoogleNativeAuthConfig) {
    this.config = {
      scopes: DEFAULT_SCOPES,
      persistTokens: true,
      ...config,
    };
    this.storage = config.storage;
    this.storageKey = config.storageKey ?? DEFAULT_STORAGE_KEY;
  }

  async onInit(): Promise<GoogleAuthTokens | null> {
    if (!this.configured) {
      GoogleSignInModule.configure(this.config);
      this.configured = true;
    }

    if (!this.config.persistTokens) {
      return null;
    }

    const raw = await this.storage.getItem(this.storageKey);
    if (!raw) {
      return null;
    }

    try {
      const tokens: GoogleAuthTokens = JSON.parse(raw);

      if (tokens.expiresAt && Date.now() >= tokens.expiresAt) {
        // Token expired — try silent sign-in to refresh
        try {
          const refreshed = await GoogleSignInModule.signInSilently();
          const newTokens = this.mapToTokens(refreshed);
          await this.persistTokens(newTokens);
          return newTokens;
        } catch {
          await this.storage.removeItem(this.storageKey);
          return null;
        }
      }

      return tokens;
    } catch {
      await this.storage.removeItem(this.storageKey);
      return null;
    }
  }

  async onLogin(credentials?: GoogleAuthCredentials): Promise<GoogleAuthTokens> {
    if (!this.configured) {
      GoogleSignInModule.configure(this.config);
      this.configured = true;
    }

    if (!credentials?.idToken) {
      throw new Error(
        'GoogleAuthClient: credentials with idToken are required. ' +
        'Trigger Google Sign-In via GoogleSignInButton or GoogleSignInModule.signIn() and pass the result to login().'
      );
    }

    const tokens = this.mapToTokens(credentials);
    await this.persistTokens(tokens);
    return tokens;
  }

  async onRefresh(currentTokens: GoogleAuthTokens): Promise<GoogleAuthTokens> {
    if (!this.configured) {
      GoogleSignInModule.configure(this.config);
      this.configured = true;
    }

    // Check if current tokens are still valid
    if (currentTokens.expiresAt && Date.now() < currentTokens.expiresAt) {
      return currentTokens;
    }

    try {
      const refreshed = await GoogleSignInModule.signInSilently();
      const tokens = this.mapToTokens(refreshed);
      await this.persistTokens(tokens);
      return tokens;
    } catch {
      // If silent sign-in fails, try getTokens
      const freshTokens = await GoogleSignInModule.getTokens();
      const tokens: GoogleAuthTokens = {
        idToken: freshTokens.idToken,
        accessToken: freshTokens.accessToken,
        expiresAt: this.extractExpiration(freshTokens.idToken),
      };
      await this.persistTokens(tokens);
      return tokens;
    }
  }

  async onLogout(): Promise<void> {
    await GoogleSignInModule.signOut();
    await this.storage.removeItem(this.storageKey);
  }

  private mapToTokens(credentials: GoogleAuthCredentials): GoogleAuthTokens {
    return {
      idToken: credentials.idToken,
      accessToken: credentials.accessToken,
      serverAuthCode: credentials.serverAuthCode,
      expiresAt: this.extractExpiration(credentials.idToken),
    };
  }

  private async persistTokens(tokens: GoogleAuthTokens): Promise<void> {
    if (this.config.persistTokens) {
      await this.storage.setItem(this.storageKey, JSON.stringify(tokens));
    }
  }

  private extractExpiration(idToken: string): number | undefined {
    try {
      const payload = idToken.split('.')[1];
      if (!payload) return undefined;

      // Base64url decode
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const decoded = JSON.parse(atob(base64));
      if (typeof decoded.exp === 'number') {
        return decoded.exp * 1000;
      }
      return undefined;
    } catch {
      return undefined;
    }
  }
}
