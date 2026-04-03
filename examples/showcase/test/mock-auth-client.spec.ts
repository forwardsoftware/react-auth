import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { MockAuthClient, VALID_CREDENTIALS } from '../src/mock-auth-client';
import type { MockTokens } from '../src/mock-auth-client';

const STORAGE_KEY = 'react-auth-showcase-tokens';

describe('MockAuthClient', () => {
  let client: MockAuthClient;

  beforeEach(() => {
    localStorage.clear();
    client = new MockAuthClient(0);
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('onInit', () => {
    it('should return null when no tokens are stored', async () => {
      // Arrange — empty localStorage

      // Act
      const result = await client.onInit();

      // Assert
      expect(result).toBeNull();
    });

    it('should restore valid tokens from localStorage', async () => {
      // Arrange
      const storedTokens: MockTokens = {
        accessToken: 'stored-access',
        refreshToken: 'stored-refresh',
        expiresAt: Date.now() + 60_000,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storedTokens));

      // Act
      const result = await client.onInit();

      // Assert
      expect(result).toEqual(storedTokens);
    });

    it('should return null for expired tokens', async () => {
      // Arrange
      const expiredTokens: MockTokens = {
        accessToken: 'expired-access',
        refreshToken: 'expired-refresh',
        expiresAt: Date.now() - 1000,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(expiredTokens));

      // Act
      const result = await client.onInit();

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('onLogin', () => {
    it('should return tokens for valid credentials', async () => {
      // Arrange — use VALID_CREDENTIALS

      // Act
      const tokens = await client.onLogin(VALID_CREDENTIALS);

      // Assert
      expect(tokens).toHaveProperty('accessToken');
      expect(tokens).toHaveProperty('refreshToken');
      expect(tokens).toHaveProperty('expiresAt');
      expect(tokens.expiresAt).toBeGreaterThan(Date.now());
    });

    it('should persist tokens to localStorage on success', async () => {
      // Arrange — empty localStorage

      // Act
      await client.onLogin(VALID_CREDENTIALS);

      // Assert
      const stored = localStorage.getItem(STORAGE_KEY);
      expect(stored).not.toBeNull();
      expect(JSON.parse(stored!)).toHaveProperty('accessToken');
    });

    it('should throw for invalid credentials', async () => {
      // Arrange
      const badCredentials = { username: 'wrong', password: 'wrong' };

      // Act & Assert
      await expect(client.onLogin(badCredentials)).rejects.toThrow('Invalid credentials');
    });

    it('should throw when no credentials are provided', async () => {
      // Act & Assert
      await expect(client.onLogin()).rejects.toThrow('Invalid credentials');
    });
  });

  describe('onRefresh', () => {
    it('should generate new tokens', async () => {
      // Arrange
      const currentTokens: MockTokens = {
        accessToken: 'old-access',
        refreshToken: 'old-refresh',
        expiresAt: Date.now() + 10_000,
      };

      // Act
      const newTokens = await client.onRefresh(currentTokens);

      // Assert
      expect(newTokens.accessToken).not.toBe(currentTokens.accessToken);
      expect(newTokens.refreshToken).not.toBe(currentTokens.refreshToken);
      expect(newTokens.expiresAt).toBeGreaterThan(Date.now());
    });

    it('should persist refreshed tokens to localStorage', async () => {
      // Arrange
      const currentTokens: MockTokens = {
        accessToken: 'old-access',
        refreshToken: 'old-refresh',
        expiresAt: Date.now() + 10_000,
      };

      // Act
      const newTokens = await client.onRefresh(currentTokens);

      // Assert
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
      expect(stored.accessToken).toBe(newTokens.accessToken);
    });
  });

  describe('onLogout', () => {
    it('should clear localStorage', async () => {
      // Arrange
      localStorage.setItem(STORAGE_KEY, '{"accessToken":"x"}');

      // Act
      await client.onLogout();

      // Assert
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });
  });

  describe('lifecycle hooks', () => {
    it('should have callable onPostInit', async () => {
      // Act & Assert
      await expect(client.onPostInit()).resolves.toBeUndefined();
    });

    it('should have callable onPreLogin', async () => {
      // Act & Assert
      await expect(client.onPreLogin()).resolves.toBeUndefined();
    });

    it('should have callable onPostLogin', async () => {
      // Act & Assert
      await expect(client.onPostLogin(true)).resolves.toBeUndefined();
      await expect(client.onPostLogin(false)).resolves.toBeUndefined();
    });

    it('should have callable onPreRefresh', async () => {
      // Act & Assert
      await expect(client.onPreRefresh()).resolves.toBeUndefined();
    });

    it('should have callable onPostRefresh', async () => {
      // Act & Assert
      await expect(client.onPostRefresh(true)).resolves.toBeUndefined();
      await expect(client.onPostRefresh(false)).resolves.toBeUndefined();
    });

    it('should have callable onPreLogout', async () => {
      // Act & Assert
      await expect(client.onPreLogout()).resolves.toBeUndefined();
    });

    it('should have callable onPostLogout', async () => {
      // Act & Assert
      await expect(client.onPostLogout(true)).resolves.toBeUndefined();
      await expect(client.onPostLogout(false)).resolves.toBeUndefined();
    });
  });
});
