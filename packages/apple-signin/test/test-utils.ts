import type { TokenStorage } from '../src/types';

export class MockTokenStorage implements TokenStorage {
  private store: Map<string, string> = new Map();

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  has(key: string): boolean {
    return this.store.has(key);
  }
}

export function createMockAppleIdToken(claims: Record<string, unknown> = {}): string {
  const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = btoa(
    JSON.stringify({
      iss: 'https://appleid.apple.com',
      sub: '001234.abcdef1234567890.1234',
      aud: 'com.example.app',
      email: 'test@privaterelay.appleid.com',
      email_verified: true,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      ...claims,
    })
  );
  const signature = btoa('mock-signature');
  return `${header}.${payload}.${signature}`;
}

export function createExpiredMockAppleIdToken(): string {
  return createMockAppleIdToken({
    exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
  });
}
