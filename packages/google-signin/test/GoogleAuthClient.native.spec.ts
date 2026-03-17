import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MockTokenStorage, createMockIdToken, createExpiredMockIdToken } from './test-utils';
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
    signInSilently: vi.fn(),
    getTokens: vi.fn(),
    signOut: vi.fn(),
  }),
}));

// Import after mocking
import { GoogleAuthClient } from '../src/native/GoogleAuthClient';
import * as GoogleSignInModule from '../src/native/GoogleSignInModule';

describe('GoogleAuthClient (Native)', () => {
  let storage: MockTokenStorage;
  let client: GoogleAuthClient;

  beforeEach(() => {
    vi.clearAllMocks();
    storage = new MockTokenStorage();
    client = new GoogleAuthClient({
      clientId: 'test-client-id',
      webClientId: 'test-web-client-id',
      storage,
    });
  });

  describe('onInit', () => {
    it('should configure the native module and return null when no tokens are stored', async () => {
      const configureSpy = vi.spyOn(GoogleSignInModule, 'configure');

      const result = await client.onInit();

      expect(configureSpy).toHaveBeenCalledWith(
        expect.objectContaining({ clientId: 'test-client-id' })
      );
      expect(result).toBeNull();
    });

    it('should return stored tokens when they are valid', async () => {
      const idToken = createMockIdToken();
      const tokens = {
        idToken,
        expiresAt: Date.now() + 3600000,
      };
      storage.setItem(DEFAULT_STORAGE_KEY, JSON.stringify(tokens));

      const result = await client.onInit();
      expect(result).not.toBeNull();
      expect(result!.idToken).toBe(idToken);
    });

    it('should attempt silent sign-in when tokens are expired', async () => {
      const expiredTokens = {
        idToken: createExpiredMockIdToken(),
        expiresAt: Date.now() - 3600000,
      };
      storage.setItem(DEFAULT_STORAGE_KEY, JSON.stringify(expiredTokens));

      const freshIdToken = createMockIdToken();
      vi.spyOn(GoogleSignInModule, 'signInSilently').mockResolvedValueOnce({
        idToken: freshIdToken,
      });

      const result = await client.onInit();
      expect(result).not.toBeNull();
      expect(result!.idToken).toBe(freshIdToken);
    });

    it('should return null when tokens are expired and silent sign-in fails', async () => {
      const expiredTokens = {
        idToken: createExpiredMockIdToken(),
        expiresAt: Date.now() - 3600000,
      };
      storage.setItem(DEFAULT_STORAGE_KEY, JSON.stringify(expiredTokens));

      vi.spyOn(GoogleSignInModule, 'signInSilently').mockRejectedValueOnce(
        new Error('No previous sign-in')
      );

      const result = await client.onInit();
      expect(result).toBeNull();
      expect(storage.has(DEFAULT_STORAGE_KEY)).toBe(false);
    });
  });

  describe('onLogin', () => {
    it('should store and return tokens when valid credentials are provided', async () => {
      const idToken = createMockIdToken();
      const credentials = { idToken };

      const result = await client.onLogin(credentials);

      expect(result.idToken).toBe(idToken);
      expect(storage.has(DEFAULT_STORAGE_KEY)).toBe(true);
    });

    it('should throw when no credentials are provided', async () => {
      await expect(client.onLogin()).rejects.toThrow('credentials with idToken are required');
    });
  });

  describe('onRefresh', () => {
    it('should return current tokens if they are not expired', async () => {
      const idToken = createMockIdToken();
      const currentTokens = {
        idToken,
        expiresAt: Date.now() + 3600000,
      };

      const result = await client.onRefresh(currentTokens);
      expect(result).toBe(currentTokens);
    });

    it('should call signInSilently when tokens are expired', async () => {
      const freshIdToken = createMockIdToken();
      vi.spyOn(GoogleSignInModule, 'signInSilently').mockResolvedValueOnce({
        idToken: freshIdToken,
      });

      const expiredTokens = {
        idToken: createExpiredMockIdToken(),
        expiresAt: Date.now() - 3600000,
      };

      const result = await client.onRefresh(expiredTokens);
      expect(result.idToken).toBe(freshIdToken);
      expect(storage.has(DEFAULT_STORAGE_KEY)).toBe(true);
    });

    it('should fallback to getTokens when signInSilently fails', async () => {
      const freshIdToken = createMockIdToken();
      vi.spyOn(GoogleSignInModule, 'signInSilently').mockRejectedValueOnce(
        new Error('Silent sign-in failed')
      );
      vi.spyOn(GoogleSignInModule, 'getTokens').mockResolvedValueOnce({
        idToken: freshIdToken,
        accessToken: 'fresh-access-token',
      });

      const expiredTokens = {
        idToken: createExpiredMockIdToken(),
        expiresAt: Date.now() - 3600000,
      };

      const result = await client.onRefresh(expiredTokens);
      expect(result.idToken).toBe(freshIdToken);
      expect(result.accessToken).toBe('fresh-access-token');
    });
  });

  describe('onLogout', () => {
    it('should call signOut and clear storage', async () => {
      const signOutSpy = vi.spyOn(GoogleSignInModule, 'signOut').mockResolvedValueOnce();
      storage.setItem(DEFAULT_STORAGE_KEY, JSON.stringify({ idToken: 'test' }));

      await client.onLogout();

      expect(signOutSpy).toHaveBeenCalled();
      expect(storage.has(DEFAULT_STORAGE_KEY)).toBe(false);
    });
  });
});
