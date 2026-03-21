import { describe, it, expect, beforeEach } from 'vitest';
import { AppleAuthClient } from '../src/web/AppleAuthClient';
import {
  MockTokenStorage,
  createMockAppleIdToken,
  createExpiredMockAppleIdToken,
} from './test-utils';
import { DEFAULT_STORAGE_KEY } from '../src/types';

describe('AppleAuthClient (Web)', () => {
  let storage: MockTokenStorage;
  let client: AppleAuthClient;

  beforeEach(() => {
    storage = new MockTokenStorage();
    client = new AppleAuthClient({
      clientId: 'com.example.app',
      redirectURI: 'https://example.com/callback',
      storage,
    });
  });

  describe('onInit', () => {
    it('should return null when no tokens are stored', async () => {
      const result = await client.onInit();
      expect(result).toBeNull();
    });

    it('should return stored tokens when they are valid', async () => {
      const identityToken = createMockAppleIdToken();
      const tokens = {
        identityToken,
        expiresAt: Date.now() + 3600000,
      };
      storage.setItem(DEFAULT_STORAGE_KEY, JSON.stringify(tokens));

      const result = await client.onInit();
      expect(result).not.toBeNull();
      expect(result!.identityToken).toBe(identityToken);
    });

    it('should return null and clear storage when tokens are expired', async () => {
      const tokens = {
        identityToken: createExpiredMockAppleIdToken(),
        expiresAt: Date.now() - 3600000,
      };
      storage.setItem(DEFAULT_STORAGE_KEY, JSON.stringify(tokens));

      const result = await client.onInit();
      expect(result).toBeNull();
      expect(storage.has(DEFAULT_STORAGE_KEY)).toBe(false);
    });

    it('should return null and clear storage when stored data is corrupted', async () => {
      storage.setItem(DEFAULT_STORAGE_KEY, 'not-valid-json');

      const result = await client.onInit();
      expect(result).toBeNull();
      expect(storage.has(DEFAULT_STORAGE_KEY)).toBe(false);
    });

    it('should return null when persistTokens is false', async () => {
      const clientNoPersist = new AppleAuthClient({
        clientId: 'com.example.app',
        redirectURI: 'https://example.com/callback',
        storage,
        persistTokens: false,
      });

      const tokens = {
        identityToken: createMockAppleIdToken(),
        expiresAt: Date.now() + 3600000,
      };
      storage.setItem(DEFAULT_STORAGE_KEY, JSON.stringify(tokens));

      const result = await clientNoPersist.onInit();
      expect(result).toBeNull();
    });
  });

  describe('onLogin', () => {
    it('should store and return tokens when valid credentials are provided', async () => {
      const identityToken = createMockAppleIdToken();
      const credentials = { identityToken };

      const result = await client.onLogin(credentials);

      expect(result.identityToken).toBe(identityToken);
      expect(result.expiresAt).toBeDefined();
      expect(storage.has(DEFAULT_STORAGE_KEY)).toBe(true);
    });

    it('should include optional fields when provided', async () => {
      const identityToken = createMockAppleIdToken();
      const credentials = {
        identityToken,
        authorizationCode: 'test-auth-code',
        email: 'test@example.com',
        fullName: { givenName: 'Test', familyName: 'User' },
        user: '001234.abcdef1234567890.1234',
      };

      const result = await client.onLogin(credentials);

      expect(result.authorizationCode).toBe('test-auth-code');
      expect(result.email).toBe('test@example.com');
      expect(result.fullName?.givenName).toBe('Test');
      expect(result.user).toBe('001234.abcdef1234567890.1234');
    });

    it('should throw when no credentials are provided', async () => {
      await expect(client.onLogin()).rejects.toThrow(
        'credentials with identityToken are required',
      );
    });

    it('should throw when credentials have no identityToken', async () => {
      await expect(client.onLogin({ identityToken: '' })).rejects.toThrow(
        'credentials with identityToken are required',
      );
    });

    it('should not persist when persistTokens is false', async () => {
      const clientNoPersist = new AppleAuthClient({
        clientId: 'com.example.app',
        redirectURI: 'https://example.com/callback',
        storage,
        persistTokens: false,
      });

      const identityToken = createMockAppleIdToken();
      await clientNoPersist.onLogin({ identityToken });

      expect(storage.has(DEFAULT_STORAGE_KEY)).toBe(false);
    });

    it('should use custom storage key when provided', async () => {
      const customKey = 'my-custom-key';
      const customClient = new AppleAuthClient({
        clientId: 'com.example.app',
        redirectURI: 'https://example.com/callback',
        storage,
        storageKey: customKey,
      });

      const identityToken = createMockAppleIdToken();
      await customClient.onLogin({ identityToken });

      expect(storage.has(customKey)).toBe(true);
      expect(storage.has(DEFAULT_STORAGE_KEY)).toBe(false);
    });
  });

  describe('onLogout', () => {
    it('should clear stored tokens', async () => {
      storage.setItem(DEFAULT_STORAGE_KEY, JSON.stringify({ identityToken: 'test' }));

      await client.onLogout();

      expect(storage.has(DEFAULT_STORAGE_KEY)).toBe(false);
    });
  });

  describe('token expiration extraction', () => {
    it('should extract expiration from a valid JWT', async () => {
      const exp = Math.floor(Date.now() / 1000) + 7200;
      const identityToken = createMockAppleIdToken({ exp });

      const result = await client.onLogin({ identityToken });

      expect(result.expiresAt).toBe(exp * 1000);
    });

    it('should handle tokens without exp claim', async () => {
      const header = btoa(JSON.stringify({ alg: 'none' }));
      const payload = btoa(JSON.stringify({ sub: '123' }));
      const identityToken = `${header}.${payload}.sig`;

      const result = await client.onLogin({ identityToken });

      expect(result.expiresAt).toBeUndefined();
    });
  });
});
