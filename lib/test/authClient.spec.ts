import * as rtl from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';

import {
  createMockAuthClient,
  createMockAuthClientWithHooks,
} from './test-utils';

afterEach(require('@testing-library/react').cleanup);

describe('AuthClient', () => {
  describe('on Init', () => {
    it('should notify success', async () => {
      const initSuccessEventListener = jest.fn();

      const authClientStub = createMockAuthClient();
      jest.spyOn(authClientStub, 'onInit').mockResolvedValue(undefined);

      authClientStub.on('initSuccess', initSuccessEventListener);

      await rtl.act(async () => {
        await authClientStub.init();
      });

      expect(initSuccessEventListener).toHaveBeenCalledTimes(1);
    });

    it('should notify failure', async () => {
      const initFailureEventListener = jest.fn();

      const authClientStub = createMockAuthClient();
      authClientStub.on('initFailed', initFailureEventListener);

      await rtl.act(async () => {
        await authClientStub.init();
      });

      expect(initFailureEventListener).toHaveBeenCalledTimes(1);
    });

    it('should invoke postInit hook', async () => {
      const postInitHook = jest.fn();

      const authClientStub = createMockAuthClientWithHooks({
        onPostInit: postInitHook,
      });
      jest.spyOn(authClientStub, 'onInit').mockResolvedValue(undefined);

      await rtl.act(async () => {
        await authClientStub.init();
      });

      expect(postInitHook).toHaveBeenCalledTimes(1);
    });
  });

  describe('on Login', () => {
    it('should notify start', async () => {
      const loginStartedListener = jest.fn();

      const authClientStub = createMockAuthClient();
      authClientStub.on('loginStarted', loginStartedListener);

      await rtl.act(async () => {
        await authClientStub.login();
      });

      expect(loginStartedListener).toHaveBeenCalledTimes(1);
    });

    it('should notify success', async () => {
      const loginSuccessEventListener = jest.fn();

      const authClientStub = createMockAuthClient();
      jest.spyOn(authClientStub, 'onLogin').mockResolvedValue({
        authToken: 'tkn',
        refreshToken: 'tkn',
      });

      authClientStub.on('loginSuccess', loginSuccessEventListener);

      await rtl.act(async () => {
        await authClientStub.login();
      });

      expect(loginSuccessEventListener).toHaveBeenCalledTimes(1);
    });

    it('should notify failure', async () => {
      const loginFailureEventListener = jest.fn();

      const authClientStub = createMockAuthClient();
      authClientStub.on('loginFailed', loginFailureEventListener);

      await rtl.act(async () => {
        await authClientStub.login();
      });

      expect(loginFailureEventListener).toHaveBeenCalledTimes(1);
    });

    it('should invoke preLogin and postLogin hooks in case of success', async () => {
      const preLoginHook = jest.fn();
      const postLoginHook = jest.fn();

      const authClientStub = createMockAuthClientWithHooks({
        onPreLogin: preLoginHook,
        onPostLogin: postLoginHook,
      });
      jest.spyOn(authClientStub, 'onLogin').mockResolvedValue({
        authToken: 'tkn',
        refreshToken: 'tkn',
      });

      await rtl.act(async () => {
        await authClientStub.login();
      });

      expect(preLoginHook).toHaveBeenCalledTimes(1);
      expect(postLoginHook).toHaveBeenCalledTimes(1);
      expect(postLoginHook).toHaveBeenCalledWith(true);
    });

    it('should invoke preLogin and postLogin hooks in case of failure', async () => {
      const preLoginHook = jest.fn();
      const postLoginHook = jest.fn();

      const authClientStub = createMockAuthClientWithHooks({
        onPreLogin: preLoginHook,
        onPostLogin: postLoginHook,
      });

      await rtl.act(async () => {
        await authClientStub.login();
      });

      expect(preLoginHook).toHaveBeenCalledTimes(1);
      expect(postLoginHook).toHaveBeenCalledTimes(1);
      expect(postLoginHook).toHaveBeenCalledWith(false);
    });
  });

  describe('on Refresh', () => {
    it('should notify start', async () => {
      const refreshStartedListener = jest.fn();

      const authClientStub = createMockAuthClient();
      authClientStub.on('refreshStarted', refreshStartedListener);

      await rtl.act(async () => {
        await authClientStub.refresh();
      });

      expect(refreshStartedListener).toHaveBeenCalledTimes(1);
    });

    it('should notify success', async () => {
      const refreshSuccessEventListener = jest.fn();

      const authClientStub = createMockAuthClient();
      jest.spyOn(authClientStub, 'onRefresh').mockResolvedValue({
        authToken: 'tkn',
        refreshToken: 'tkn',
      });

      authClientStub.on('refreshSuccess', refreshSuccessEventListener);

      await rtl.act(async () => {
        await authClientStub.refresh();
      });

      expect(refreshSuccessEventListener).toHaveBeenCalledTimes(1);
    });

    it('should notify failure', async () => {
      const refreshFailureEventListener = jest.fn();

      const authClientStub = createMockAuthClient();
      authClientStub.on('refreshFailed', refreshFailureEventListener);

      await rtl.act(async () => {
        await authClientStub.refresh();
      });

      expect(refreshFailureEventListener).toHaveBeenCalledTimes(1);
    });

    it('should NOT trigger onRefresh twice', async () => {
      const authClientStub = createMockAuthClient();
      jest.spyOn(authClientStub, 'onRefresh').mockResolvedValue({
        authToken: 'tkn',
        refreshToken: 'tkn',
      });

      await rtl.act(() => {
        authClientStub.refresh();

        authClientStub.refresh();
      });

      expect(authClientStub.onRefresh).toHaveBeenCalledTimes(1);
    });

    it('should NOT emit refresh events twice', async () => {
      const refreshStartedListener = jest.fn();
      const refreshSuccessEventListener = jest.fn();
      const refreshFailureEventListener = jest.fn();

      const authClientStub = createMockAuthClient();
      jest.spyOn(authClientStub, 'onRefresh').mockResolvedValue({
        authToken: 'tkn',
        refreshToken: 'tkn',
      });

      authClientStub.on('refreshSuccess', refreshSuccessEventListener);
      authClientStub.on('refreshStarted', refreshStartedListener);
      authClientStub.on('refreshFailed', refreshFailureEventListener);

      await rtl.act(() => {
        authClientStub.refresh();

        authClientStub.refresh();
      });

      expect(refreshStartedListener).toHaveBeenCalledTimes(1);
      expect(refreshSuccessEventListener).toHaveBeenCalledTimes(1);
      expect(refreshFailureEventListener).toHaveBeenCalledTimes(0);
    });

    it('should invoke preRefresh and postRefresh hooks in case of success', async () => {
      const preRefreshHook = jest.fn();
      const postRefreshHook = jest.fn();

      const authClientStub = createMockAuthClientWithHooks({
        onPreRefresh: preRefreshHook,
        onPostRefresh: postRefreshHook,
      });
      jest.spyOn(authClientStub, 'onRefresh').mockResolvedValue({
        authToken: 'tkn',
        refreshToken: 'tkn',
      });

      await rtl.act(async () => {
        await authClientStub.refresh();
      });

      expect(preRefreshHook).toHaveBeenCalledTimes(1);
      expect(postRefreshHook).toHaveBeenCalledTimes(1);
      expect(postRefreshHook).toHaveBeenCalledWith(true);
    });

    it('should invoke preRefresh and postRefresh hooks in case of failure', async () => {
      const preRefreshHook = jest.fn();
      const postRefreshHook = jest.fn();

      const authClientStub = createMockAuthClientWithHooks({
        onPreRefresh: preRefreshHook,
        onPostRefresh: postRefreshHook,
      });

      await rtl.act(async () => {
        await authClientStub.refresh();
      });

      expect(preRefreshHook).toHaveBeenCalledTimes(1);
      expect(postRefreshHook).toHaveBeenCalledTimes(1);
      expect(postRefreshHook).toHaveBeenCalledWith(false);
    });
  });

  describe('on logout', () => {
    it('should notify start', async () => {
      const logoutStartedListener = jest.fn();

      const authClientStub = createMockAuthClient();
      authClientStub.on('logoutStarted', logoutStartedListener);

      await rtl.act(async () => {
        await authClientStub.logout();
      });

      expect(logoutStartedListener).toHaveBeenCalledTimes(1);
    });

    it('should notify success', async () => {
      const logoutSuccessEventListener = jest.fn();

      const authClientStub = createMockAuthClient();
      jest.spyOn(authClientStub, 'onLogout').mockResolvedValue(undefined);

      authClientStub.on('logoutSuccess', logoutSuccessEventListener);

      await rtl.act(async () => {
        await authClientStub.logout();
      });

      expect(logoutSuccessEventListener).toHaveBeenCalledTimes(1);
    });

    it('should notify failure', async () => {
      const logoutFailureEventListener = jest.fn();

      const authClientStub = createMockAuthClient();
      authClientStub.on('logoutFailed', logoutFailureEventListener);

      await rtl.act(async () => {
        await authClientStub.logout();
      });

      expect(logoutFailureEventListener).toHaveBeenCalledTimes(1);
    });

    it('should invoke preLogout and postLogout hooks in case of success', async () => {
      const preLogoutHook = jest.fn();
      const postLogoutHook = jest.fn();

      const authClientStub = createMockAuthClientWithHooks({
        onPreLogout: preLogoutHook,
        onPostLogout: postLogoutHook,
      });
      jest.spyOn(authClientStub, 'onLogout').mockResolvedValue(undefined);

      await rtl.act(async () => {
        await authClientStub.logout();
      });

      expect(preLogoutHook).toHaveBeenCalledTimes(1);
      expect(postLogoutHook).toHaveBeenCalledTimes(1);
      expect(postLogoutHook).toHaveBeenCalledWith(true);
    });

    it('should invoke preLogout and postLogout hooks in case of failure', async () => {
      const preLogoutHook = jest.fn();
      const postLogoutHook = jest.fn();

      const authClientStub = createMockAuthClientWithHooks({
        onPreLogout: preLogoutHook,
        onPostLogout: postLogoutHook,
      });

      await rtl.act(async () => {
        await authClientStub.logout();
      });

      expect(preLogoutHook).toHaveBeenCalledTimes(1);
      expect(postLogoutHook).toHaveBeenCalledTimes(1);
      expect(postLogoutHook).toHaveBeenCalledWith(false);
    });
  });

  describe('when requested', () => {
    it('should return empty tokens by default', async () => {
      const authClientStub = createMockAuthClient();

      expect(authClientStub.tokens).toStrictEqual({});
    });

    it('should return current tokens after login', async () => {
      const authClientStub = createMockAuthClient();
      jest.spyOn(authClientStub, 'onLogin').mockResolvedValue({
        authToken: 'a.fake.tkn',
        refreshToken: 'a.fake.tkn',
      });

      await rtl.act(async () => {
        await authClientStub.login();
      });

      expect(authClientStub.tokens).toStrictEqual({
        authToken: 'a.fake.tkn',
        refreshToken: 'a.fake.tkn',
      });
    });
  });

  describe('when event listener is removed', () => {
    it('should not crash if no listener is defined', async () => {
      const initSuccessEventListener = jest.fn();

      const authClientStub = createMockAuthClient();

      expect(() => {
        authClientStub.off('initSuccess', initSuccessEventListener);
      }).not.toThrow();

      expect(initSuccessEventListener).not.toBeCalled();
    });

    it('should not be invoked on login success', async () => {
      const loginSuccessEventListener = jest.fn();

      const authClientStub = createMockAuthClient();
      jest.spyOn(authClientStub, 'onLogin').mockResolvedValue({
        authToken: 'tkn',
        refreshToken: 'tkn',
      });

      authClientStub.on('loginSuccess', loginSuccessEventListener);

      await rtl.act(async () => {
        await authClientStub.login();
      });

      authClientStub.off('loginSuccess', loginSuccessEventListener);

      await rtl.act(async () => {
        await authClientStub.login();
      });

      expect(loginSuccessEventListener).toHaveBeenCalledTimes(1);
    });

    it('should not be invoked on login failed', async () => {
      const loginFailureEventListener = jest.fn();

      const authClientStub = createMockAuthClient();
      authClientStub.on('loginFailed', loginFailureEventListener);

      await rtl.act(async () => {
        await authClientStub.login();
      });

      authClientStub.off('loginFailed', loginFailureEventListener);

      await rtl.act(async () => {
        await authClientStub.login();
      });

      expect(loginFailureEventListener).toHaveBeenCalledTimes(1);
    });

    it('should not be invoked on refresh success', async () => {
      const refreshStartedListener = jest.fn();
      const refreshSuccessEventListener = jest.fn();
      const refreshFailureEventListener = jest.fn();

      const authClientStub = createMockAuthClient();
      jest.spyOn(authClientStub, 'onRefresh').mockResolvedValue({
        authToken: 'tkn',
        refreshToken: 'tkn',
      });

      authClientStub.on('refreshSuccess', refreshSuccessEventListener);
      authClientStub.on('refreshStarted', refreshStartedListener);
      authClientStub.on('refreshFailed', refreshFailureEventListener);

      await rtl.act(() => {
        authClientStub.refresh();
      });

      authClientStub.off('refreshSuccess', refreshSuccessEventListener);
      authClientStub.off('refreshStarted', refreshStartedListener);
      authClientStub.off('refreshFailed', refreshFailureEventListener);

      await rtl.act(() => {
        authClientStub.refresh();
      });

      expect(refreshStartedListener).toHaveBeenCalledTimes(1);
      expect(refreshSuccessEventListener).toHaveBeenCalledTimes(1);
      expect(refreshFailureEventListener).toHaveBeenCalledTimes(0);
    });

    it('should not be invoked on refresh failed', async () => {
      const refreshStartedListener = jest.fn();
      const refreshSuccessEventListener = jest.fn();
      const refreshFailureEventListener = jest.fn();

      const authClientStub = createMockAuthClient();
      jest.spyOn(authClientStub, 'onRefresh').mockRejectedValue(null);

      authClientStub.on('refreshSuccess', refreshSuccessEventListener);
      authClientStub.on('refreshStarted', refreshStartedListener);
      authClientStub.on('refreshFailed', refreshFailureEventListener);

      await rtl.act(() => {
        authClientStub.refresh();
      });

      authClientStub.off('refreshSuccess', refreshSuccessEventListener);
      authClientStub.off('refreshStarted', refreshStartedListener);
      authClientStub.off('refreshFailed', refreshFailureEventListener);

      await rtl.act(() => {
        authClientStub.refresh();
      });

      expect(refreshStartedListener).toHaveBeenCalledTimes(1);
      expect(refreshSuccessEventListener).toHaveBeenCalledTimes(0);
      expect(refreshFailureEventListener).toHaveBeenCalledTimes(1);
    });
  });
});
