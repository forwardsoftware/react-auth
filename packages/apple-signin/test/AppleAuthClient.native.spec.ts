import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MockTokenStorage, createMockAppleIdToken, createExpiredMockAppleIdToken } from './test-utils';
import { DEFAULT_STORAGE_KEY } from '../src/types';

// Mock react-native Platform
vi.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

// Mock the native module
vi.mock('expo-modules-core', () => ({
  requireNativeModule: () => ({
    configure: vi.fn(),
    signIn: vi.fn(),
    getCredentialState: vi.fn(),
    signOut: vi.fn(),
  }),
}));

// Import after mocking
import { AppleAuthClient } from '../src/native/AppleAuthClient';
import * as AppleSignInModule from '../src/native/AppleSignInModule';

describe('AppleAuthClient (Native)', () => {
  let storage: MockTokenStorage;
  let client: AppleAuthClient;

  beforeEach(() => {
    vi.clearAllMocks();
    storage = new MockTokenStorage();
    client = new AppleAuthClient({
      clientId: 'com.example.app',
      storage,
    });
  });

  describe('onInit', () => {
    it('should configure the native module and return null when no tokens are stored', async () => {
      const configureSpy = vi.spyOn(AppleSignInModule, 'configure');

      const result = await client.onInit();

      expect(configureSpy).toHaveBeenCalledWith(
        expect.objectContaining({ clientId: 'com.example.app' })
      );
      expect(result).toBeNull();
    });

    it('should return stored tokens when they are valid', async () => {
      const identityToken = createMockAppleIdToken();
      const tokens = {
        identityToken,
        user: '001234.abcdef1234567890.1234',
        expiresAt: Date.now() + 3600000,
      };
      storage.setItem(DEFAULT_STORAGE_KEY, JSON.stringify(tokens));

      vi.spyOn(AppleSignInModule, 'getCredentialState').mockResolvedValueOnce('authorized');

      const result = await client.onInit();
      expect(result).not.toBeNull();
      expect(result!.identityToken).toBe(identityToken);
    });

    it('should return null when credential state is revoked', async () => {
      const tokens = {
        identityToken: createMockAppleIdToken(),
        user: '001234.abcdef1234567890.1234',
        expiresAt: Date.now() + 3600000,
      };
      storage.setItem(DEFAULT_STORAGE_KEY, JSON.stringify(tokens));

      vi.spyOn(AppleSignInModule, 'getCredentialState').mockResolvedValueOnce('revoked');

      const result = await client.onInit();
      expect(result).toBeNull();
      expect(storage.has(DEFAULT_STORAGE_KEY)).toBe(false);
    });

    it('should return null when tokens are expired and no user ID', async () => {
      const expiredTokens = {
        identityToken: createExpiredMockAppleIdToken(),
        expiresAt: Date.now() - 3600000,
      };
      storage.setItem(DEFAULT_STORAGE_KEY, JSON.stringify(expiredTokens));

      const result = await client.onInit();
      expect(result).toBeNull();
      expect(storage.has(DEFAULT_STORAGE_KEY)).toBe(false);
    });
  });

  describe('onLogin', () => {
    it('should store and return tokens when valid credentials are provided', async () => {
      const identityToken = createMockAppleIdToken();
      const credentials = {
        identityToken,
        user: '001234.abcdef1234567890.1234',
      };

      const result = await client.onLogin(credentials);

      expect(result.identityToken).toBe(identityToken);
      expect(result.user).toBe('001234.abcdef1234567890.1234');
      expect(storage.has(DEFAULT_STORAGE_KEY)).toBe(true);
    });

    it('should throw when no credentials are provided', async () => {
      await expect(client.onLogin()).rejects.toThrow('credentials with identityToken are required');
    });
  });

  describe('onRefresh', () => {
    it('should return current tokens if credential state is authorized', async () => {
      const identityToken = createMockAppleIdToken();
      const currentTokens = {
        identityToken,
        user: '001234.abcdef1234567890.1234',
        expiresAt: Date.now() + 3600000,
      };

      vi.spyOn(AppleSignInModule, 'getCredentialState').mockResolvedValueOnce('authorized');

      const result = await client.onRefresh(currentTokens);
      expect(result).toBe(currentTokens);
    });

    it('should throw when credential state is revoked', async () => {
      const currentTokens = {
        identityToken: createMockAppleIdToken(),
        user: '001234.abcdef1234567890.1234',
        expiresAt: Date.now() + 3600000,
      };

      vi.spyOn(AppleSignInModule, 'getCredentialState').mockResolvedValueOnce('revoked');

      await expect(client.onRefresh(currentTokens)).rejects.toThrow(
        "Apple credential state is 'revoked'"
      );
    });

    it('should return current tokens if no user ID but not expired', async () => {
      const identityToken = createMockAppleIdToken();
      const currentTokens = {
        identityToken,
        expiresAt: Date.now() + 3600000,
      };

      const result = await client.onRefresh(currentTokens);
      expect(result).toBe(currentTokens);
    });

    it('should throw if no user ID and token is expired', async () => {
      const currentTokens = {
        identityToken: createExpiredMockAppleIdToken(),
        expiresAt: Date.now() - 3600000,
      };

      await expect(client.onRefresh(currentTokens)).rejects.toThrow(
        'Apple identity token has expired'
      );
    });
  });

  describe('onLogout', () => {
    it('should call signOut and clear storage', async () => {
      const signOutSpy = vi.spyOn(AppleSignInModule, 'signOut').mockResolvedValueOnce();
      storage.setItem(DEFAULT_STORAGE_KEY, JSON.stringify({ identityToken: 'test' }));

      await client.onLogout();

      expect(signOutSpy).toHaveBeenCalled();
      expect(storage.has(DEFAULT_STORAGE_KEY)).toBe(false);
    });
  });
});
