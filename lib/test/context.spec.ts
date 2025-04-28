import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';

import { createMockAuthClient } from './test-utils';

import { createAuth } from '../src';

afterEach(require('@testing-library/react').cleanup);

describe('createAuth', () => {
  it('should return a new ReactAuth with initialized values', () => {
    const rcContext = createAuth(createMockAuthClient());

    expect(rcContext).toBeDefined();
    expect(rcContext.AuthProvider).toBeDefined();
    expect(rcContext.useAuthClient).toBeDefined();
  });

  describe('useAuthClient hook', () => {
    it('should throw error if used outside AuthProvider context', async () => {
      const consoleErrorFn = vi
        .spyOn(console, 'error')
        .mockImplementation(() => vi.fn());

      const { useAuthClient } = createAuth(createMockAuthClient());

      expect(() => {
        renderHook(() => useAuthClient());
      }).toThrow('useAuthClient hook should be used inside AuthProvider');

      consoleErrorFn.mockRestore();
    });
  });
});
