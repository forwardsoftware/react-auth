import type { AuthClient } from '@forward-software/react-auth';
import type {
  AppleAuthCredentials,
  AppleAuthTokens,
  AppleNativeAuthConfig,
  TokenStorage,
} from '../types';
import { DEFAULT_SCOPES, DEFAULT_STORAGE_KEY } from '../types';
import * as AppleSignInModule from './AppleSignInModule';

export class AppleAuthClient implements AuthClient<AppleAuthTokens, AppleAuthCredentials> {
  private config: AppleNativeAuthConfig;
  private storage: TokenStorage;
  private storageKey: string;
  private configured = false;

  constructor(config: AppleNativeAuthConfig) {
    this.config = {
      scopes: DEFAULT_SCOPES,
      persistTokens: true,
      ...config,
    };
    this.storage = config.storage;
    this.storageKey = config.storageKey ?? DEFAULT_STORAGE_KEY;
  }

  async onInit(): Promise<AppleAuthTokens | null> {
    if (!this.configured) {
      AppleSignInModule.configure(this.config);
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
      const tokens: AppleAuthTokens = JSON.parse(raw);

      // Check credential state if we have a user ID
      if (tokens.user) {
        try {
          const state = await AppleSignInModule.getCredentialState(tokens.user);
          if (state !== 'authorized') {
            await this.storage.removeItem(this.storageKey);
            return null;
          }
        } catch {
          // If credential state check fails, fall back to expiry check
        }
      }

      if (tokens.expiresAt && Date.now() >= tokens.expiresAt) {
        await this.storage.removeItem(this.storageKey);
        return null;
      }

      return tokens;
    } catch {
      await this.storage.removeItem(this.storageKey);
      return null;
    }
  }

  async onLogin(credentials?: AppleAuthCredentials): Promise<AppleAuthTokens> {
    if (!this.configured) {
      AppleSignInModule.configure(this.config);
      this.configured = true;
    }

    if (!credentials?.identityToken) {
      throw new Error(
        'AppleAuthClient: credentials with identityToken are required. ' +
        'Trigger Apple Sign-In via AppleSignInButton or AppleSignInModule.signIn() and pass the result to login().'
      );
    }

    const tokens = this.mapToTokens(credentials);
    await this.persistTokens(tokens);
    return tokens;
  }

  async onRefresh(currentTokens: AppleAuthTokens): Promise<AppleAuthTokens> {
    if (!this.configured) {
      AppleSignInModule.configure(this.config);
      this.configured = true;
    }

    // Check credential state if user ID is available
    if (currentTokens.user) {
      const state = await AppleSignInModule.getCredentialState(currentTokens.user);
      if (state === 'authorized') {
        return currentTokens;
      }
      throw new Error(
        `Apple credential state is '${state}'. User must re-authenticate.`
      );
    }

    // Without a user ID, check token expiry
    if (currentTokens.expiresAt && Date.now() < currentTokens.expiresAt) {
      return currentTokens;
    }

    throw new Error(
      'Apple identity token has expired and no user ID is available to check credential state. User must re-authenticate.'
    );
  }

  async onLogout(): Promise<void> {
    await AppleSignInModule.signOut();
    await this.storage.removeItem(this.storageKey);
  }

  private mapToTokens(credentials: AppleAuthCredentials): AppleAuthTokens {
    return {
      identityToken: credentials.identityToken,
      authorizationCode: credentials.authorizationCode,
      email: credentials.email,
      fullName: credentials.fullName,
      user: credentials.user,
      expiresAt: this.extractExpiration(credentials.identityToken),
    };
  }

  private async persistTokens(tokens: AppleAuthTokens): Promise<void> {
    if (this.config.persistTokens) {
      await this.storage.setItem(this.storageKey, JSON.stringify(tokens));
    }
  }

  private base64UrlDecode(input: string): string {
    const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    return atob(padded);
  }

  private extractExpiration(identityToken: string): number | undefined {
    try {
      const payload = identityToken.split('.')[1];
      if (!payload) return undefined;

      const decodedJson = this.base64UrlDecode(payload);
      const decoded = JSON.parse(decodedJson);
      if (typeof decoded.exp === 'number') {
        return decoded.exp * 1000;
      }
      return undefined;
    } catch {
      return undefined;
    }
  }
}
