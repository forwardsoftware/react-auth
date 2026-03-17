import { describe, it, expect, beforeEach } from 'vitest';
import { GoogleAuthClient } from '../src/web/GoogleAuthClient';
import {
  MockTokenStorage,
  createMockIdToken,
  createExpiredMockIdToken,
} from './test-utils';
import { DEFAULT_STORAGE_KEY } from '../src/types';

describe('GoogleAuthClient (Web)', () => {
  let storage: MockTokenStorage;
  let client: GoogleAuthClient;

  beforeEach(() => {
    storage = new MockTokenStorage();
    client = new GoogleAuthClient({
      clientId: 'test-client-id',
      storage,
    });
  });

  describe('onInit', () => {
    it('should return null when no tokens are stored', async () => {
      const result = await client.onInit();
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

    it('should return null and clear storage when tokens are expired', async () => {
      const tokens = {
        idToken: createExpiredMockIdToken(),
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
      const clientNoPersist = new GoogleAuthClient({
        clientId: 'test-client-id',
        storage,
        persistTokens: false,
      });

      const tokens = {
        idToken: createMockIdToken(),
        expiresAt: Date.now() + 3600000,
      };
      storage.setItem(DEFAULT_STORAGE_KEY, JSON.stringify(tokens));

      const result = await clientNoPersist.onInit();
      expect(result).toBeNull();
    });
  });

  describe('onLogin', () => {
    it('should store and return tokens when valid credentials are provided', async () => {
      const idToken = createMockIdToken();
      const credentials = { idToken };

      const result = await client.onLogin(credentials);

      expect(result.idToken).toBe(idToken);
      expect(result.expiresAt).toBeDefined();
      expect(storage.has(DEFAULT_STORAGE_KEY)).toBe(true);
    });

    it('should include accessToken and serverAuthCode when provided', async () => {
      const idToken = createMockIdToken();
      const credentials = {
        idToken,
        accessToken: 'test-access-token',
        serverAuthCode: 'test-auth-code',
      };

      const result = await client.onLogin(credentials);

      expect(result.accessToken).toBe('test-access-token');
      expect(result.serverAuthCode).toBe('test-auth-code');
    });

    it('should throw when no credentials are provided', async () => {
      await expect(client.onLogin()).rejects.toThrow(
        'credentials with idToken are required',
      );
    });

    it('should throw when credentials have no idToken', async () => {
      await expect(client.onLogin({ idToken: '' })).rejects.toThrow(
        'credentials with idToken are required',
      );
    });

    it('should not persist when persistTokens is false', async () => {
      const clientNoPersist = new GoogleAuthClient({
        clientId: 'test-client-id',
        storage,
        persistTokens: false,
      });

      const idToken = createMockIdToken();
      await clientNoPersist.onLogin({ idToken });

      expect(storage.has(DEFAULT_STORAGE_KEY)).toBe(false);
    });

    it('should use custom storage key when provided', async () => {
      const customKey = 'my-custom-key';
      const customClient = new GoogleAuthClient({
        clientId: 'test-client-id',
        storage,
        storageKey: customKey,
      });

      const idToken = createMockIdToken();
      await customClient.onLogin({ idToken });

      expect(storage.has(customKey)).toBe(true);
      expect(storage.has(DEFAULT_STORAGE_KEY)).toBe(false);
    });
  });

  describe('onLogout', () => {
    it('should clear stored tokens', async () => {
      storage.setItem(DEFAULT_STORAGE_KEY, JSON.stringify({ idToken: 'test' }));

      await client.onLogout();

      expect(storage.has(DEFAULT_STORAGE_KEY)).toBe(false);
    });
  });

  describe('token expiration extraction', () => {
    it('should extract expiration from a valid JWT', async () => {
      const exp = Math.floor(Date.now() / 1000) + 7200;
      const idToken = createMockIdToken({ exp });

      const result = await client.onLogin({ idToken });

      expect(result.expiresAt).toBe(exp * 1000);
    });

    it('should handle tokens without exp claim', async () => {
      const header = btoa(JSON.stringify({ alg: 'none' }));
      const payload = btoa(JSON.stringify({ sub: '123' }));
      const idToken = `${header}.${payload}.sig`;

      const result = await client.onLogin({ idToken });

      expect(result.expiresAt).toBeUndefined();
    });
  });
});
