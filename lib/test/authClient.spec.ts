import { describe, it, expect, vi, afterEach } from "vitest";
import * as rtl from "@testing-library/react";
import "@testing-library/jest-dom";

import { wrapAuthClient } from "../src";

import { createMockAuthClient, createMockAuthClientWithHooks } from "./test-utils";

afterEach(rtl.cleanup);

describe("AuthClient", () => {
  describe("on Init", () => {
    it("should notify success", async () => {
      // Arrange

      const initSuccessEventListener = vi.fn();

      const authClientMock = createMockAuthClient();
      vi.spyOn(authClientMock, "onInit").mockResolvedValueOnce(null);

      const authClient = wrapAuthClient(authClientMock);

      authClient.on("initSuccess", initSuccessEventListener);

      // Act

      await rtl.act(async () => {
        await authClient.init();
      });

      // Assert

      expect(initSuccessEventListener).toHaveBeenCalledTimes(1);
    });

    it("should notify failure", async () => {
      // Arrange

      const authClient = wrapAuthClient(createMockAuthClient());

      const initFailureEventListener = vi.fn();
      authClient.on("initFailed", initFailureEventListener);

      // Act

      await rtl.act(async () => {
        await authClient.init();
      });

      // Assert

      expect(initFailureEventListener).toHaveBeenCalledTimes(1);
    });

    it("should invoke postInit hook", async () => {
      // Arrange

      const postInitHook = vi.fn();

      const authClientMock = createMockAuthClientWithHooks({ onPostInit: postInitHook });
      vi.spyOn(authClientMock, "onInit").mockResolvedValue(null);

      const authClient = wrapAuthClient(authClientMock);

      // Act

      await rtl.act(async () => {
        await authClient.init();
      });

      // Assert

      expect(postInitHook).toHaveBeenCalledTimes(1);
    });
  });

  describe("on Login", () => {
    it("should notify start", async () => {
      // Arrange

      const authClient = wrapAuthClient(createMockAuthClient());

      const loginStartedListener = vi.fn();
      authClient.on("loginStarted", loginStartedListener);

      // Act

      await rtl.act(async () => {
        await authClient.login();
      });

      // Assert

      expect(loginStartedListener).toHaveBeenCalledTimes(1);
    });

    it("should notify success", async () => {
      // Arrange

      const authClientMock = createMockAuthClient();
      vi.spyOn(authClientMock, "onLogin").mockResolvedValue({
        authToken: "tkn",
        refreshToken: "tkn",
      });

      const authClient = wrapAuthClient(authClientMock);

      const loginSuccessEventListener = vi.fn();
      authClient.on("loginSuccess", loginSuccessEventListener);

      // Act

      await rtl.act(async () => {
        await authClient.login();
      });

      // Assert

      expect(loginSuccessEventListener).toHaveBeenCalledTimes(1);
    });

    it("should notify failure", async () => {
      // Arrange

      const authClient = wrapAuthClient(createMockAuthClient());

      const loginFailureEventListener = vi.fn();
      authClient.on("loginFailed", loginFailureEventListener);

      // Act

      await rtl.act(async () => {
        await authClient.login();
      });

      // Assert

      expect(loginFailureEventListener).toHaveBeenCalledTimes(1);
    });

    it("should invoke preLogin and postLogin hooks in case of success", async () => {
      // Arrange

      const preLoginHook = vi.fn();
      const postLoginHook = vi.fn();

      const authClientMock = createMockAuthClientWithHooks({
        onPreLogin: preLoginHook,
        onPostLogin: postLoginHook,
      });
      vi.spyOn(authClientMock, "onLogin").mockResolvedValue({
        authToken: "tkn",
        refreshToken: "tkn",
      });

      const authClient = wrapAuthClient(authClientMock);

      // Act

      await rtl.act(async () => {
        await authClient.login();
      });

      // Assert

      expect(preLoginHook).toHaveBeenCalledTimes(1);
      expect(postLoginHook).toHaveBeenCalledTimes(1);
      expect(postLoginHook).toHaveBeenCalledWith(true);
    });

    it("should invoke preLogin and postLogin hooks in case of failure", async () => {
      // Arrange

      const preLoginHook = vi.fn();
      const postLoginHook = vi.fn();

      const authClientMock = createMockAuthClientWithHooks({
        onPreLogin: preLoginHook,
        onPostLogin: postLoginHook,
      });

      const authClient = wrapAuthClient(authClientMock);

      // Act

      await rtl.act(async () => {
        await authClient.login();
      });

      // Assert

      expect(preLoginHook).toHaveBeenCalledTimes(1);
      expect(postLoginHook).toHaveBeenCalledTimes(1);
      expect(postLoginHook).toHaveBeenCalledWith(false);
    });
  });

  describe("on Refresh", () => {
    it("should notify start", async () => {
      // Arrange

      const authClient = wrapAuthClient(createMockAuthClient());

      const refreshStartedListener = vi.fn();
      authClient.on("refreshStarted", refreshStartedListener);

      // Act

      await rtl.act(async () => {
        await authClient.refresh();
      });

      // Assert

      expect(refreshStartedListener).toHaveBeenCalledTimes(1);
    });

    it("should notify success", async () => {
      // Arrange

      const authClientMock = createMockAuthClient();
      vi.spyOn(authClientMock, "onRefresh").mockResolvedValue({
        authToken: "tkn",
        refreshToken: "tkn",
      });

      const authClient = wrapAuthClient(authClientMock);

      const refreshSuccessEventListener = vi.fn();
      authClient.on("refreshSuccess", refreshSuccessEventListener);

      // Act

      await rtl.act(async () => {
        await authClient.refresh();
      });

      // Assert

      expect(refreshSuccessEventListener).toHaveBeenCalledTimes(1);
    });

    it("should notify failure", async () => {
      // Arrange

      const authClient = wrapAuthClient(createMockAuthClient());

      const refreshFailureEventListener = vi.fn();
      authClient.on("refreshFailed", refreshFailureEventListener);

      // Act

      await rtl.act(async () => {
        await authClient.refresh();
      });

      // Assert

      expect(refreshFailureEventListener).toHaveBeenCalledTimes(1);
    });

    it("should NOT trigger onRefresh twice", async () => {
      // Arrange

      const authClientMock = createMockAuthClient();
      vi.spyOn(authClientMock, "onRefresh").mockResolvedValue({
        authToken: "tkn",
        refreshToken: "tkn",
      });

      const authClient = wrapAuthClient(authClientMock);

      // Act

      await rtl.act(() => {
        authClient.refresh();
        authClient.refresh();
      });

      // Assert

      expect(authClientMock.onRefresh).toHaveBeenCalledTimes(1);
    });

    it("should NOT emit refresh events twice", async () => {
      // Arrange

      const authClientMock = createMockAuthClient();
      vi.spyOn(authClientMock, "onRefresh").mockResolvedValue({
        authToken: "tkn",
        refreshToken: "tkn",
      });

      const authClient = wrapAuthClient(authClientMock);

      const refreshStartedListener = vi.fn();
      authClient.on("refreshStarted", refreshStartedListener);

      const refreshSuccessEventListener = vi.fn();
      authClient.on("refreshSuccess", refreshSuccessEventListener);

      const refreshFailureEventListener = vi.fn();
      authClient.on("refreshFailed", refreshFailureEventListener);

      // Act

      await rtl.act(() => {
        authClient.refresh();
        authClient.refresh();
      });

      // Assert

      expect(refreshStartedListener).toHaveBeenCalledTimes(1);
      expect(refreshSuccessEventListener).toHaveBeenCalledTimes(1);
      expect(refreshFailureEventListener).toHaveBeenCalledTimes(0);
    });

    it("should invoke preRefresh and postRefresh hooks in case of success", async () => {
      // Arrange

      const preRefreshHook = vi.fn();
      const postRefreshHook = vi.fn();

      const authClientMock = createMockAuthClientWithHooks({
        onPreRefresh: preRefreshHook,
        onPostRefresh: postRefreshHook,
      });

      vi.spyOn(authClientMock, "onRefresh").mockResolvedValue({
        authToken: "tkn",
        refreshToken: "tkn",
      });

      const authClient = wrapAuthClient(authClientMock);

      // Act

      await rtl.act(async () => {
        await authClient.refresh();
      });

      // Assert

      expect(preRefreshHook).toHaveBeenCalledTimes(1);
      expect(postRefreshHook).toHaveBeenCalledTimes(1);
      expect(postRefreshHook).toHaveBeenCalledWith(true);
    });

    it("should invoke preRefresh and postRefresh hooks in case of failure", async () => {
      // Arrange

      const preRefreshHook = vi.fn();
      const postRefreshHook = vi.fn();

      const authClientMock = createMockAuthClientWithHooks({
        onPreRefresh: preRefreshHook,
        onPostRefresh: postRefreshHook,
      });

      const authClient = wrapAuthClient(authClientMock);

      // Act

      await rtl.act(async () => {
        await authClient.refresh();
      });

      // Assert

      expect(preRefreshHook).toHaveBeenCalledTimes(1);
      expect(postRefreshHook).toHaveBeenCalledTimes(1);
      expect(postRefreshHook).toHaveBeenCalledWith(false);
    });
  });

  describe("on logout", () => {
    it("should notify start", async () => {
      // Arrange

      const authClient = wrapAuthClient(createMockAuthClient());

      const logoutStartedListener = vi.fn();
      authClient.on("logoutStarted", logoutStartedListener);

      // Act

      await rtl.act(async () => {
        await authClient.logout();
      });

      // Assert

      expect(logoutStartedListener).toHaveBeenCalledTimes(1);
    });

    it("should notify success", async () => {
      // Arrange

      const authClientMock = createMockAuthClient();
      vi.spyOn(authClientMock, "onLogout").mockResolvedValue(undefined);

      const authClient = wrapAuthClient(authClientMock);

      const logoutSuccessEventListener = vi.fn();
      authClient.on("logoutSuccess", logoutSuccessEventListener);

      // Act

      await rtl.act(async () => {
        await authClient.logout();
      });

      // Assert

      expect(logoutSuccessEventListener).toHaveBeenCalledTimes(1);
    });

    it("should notify failure", async () => {
      // Arrange

      const authClientMock = createMockAuthClient();

      const authClient = wrapAuthClient(authClientMock);

      const logoutFailureEventListener = vi.fn();
      authClient.on("logoutFailed", logoutFailureEventListener);

      // Act

      await rtl.act(async () => {
        await authClient.logout();
      });

      // Assert

      expect(logoutFailureEventListener).toHaveBeenCalledTimes(1);
    });

    it("should invoke preLogout and postLogout hooks in case of success", async () => {
      // Arrange

      const preLogoutHook = vi.fn();
      const postLogoutHook = vi.fn();

      const authClientMock = createMockAuthClientWithHooks({
        onPreLogout: preLogoutHook,
        onPostLogout: postLogoutHook,
      });
      vi.spyOn(authClientMock, "onLogout").mockResolvedValue(undefined);

      const authClient = wrapAuthClient(authClientMock);

      // Act

      await rtl.act(async () => {
        await authClient.logout();
      });

      // Assert

      expect(preLogoutHook).toHaveBeenCalledTimes(1);
      expect(postLogoutHook).toHaveBeenCalledTimes(1);
      expect(postLogoutHook).toHaveBeenCalledWith(true);
    });

    it("should invoke preLogout and postLogout hooks in case of failure", async () => {
      // Arrange

      const preLogoutHook = vi.fn();
      const postLogoutHook = vi.fn();

      const authClientMock = createMockAuthClientWithHooks({
        onPreLogout: preLogoutHook,
        onPostLogout: postLogoutHook,
      });

      const authClient = wrapAuthClient(authClientMock);

      // Act

      await rtl.act(async () => {
        await authClient.logout();
      });

      // Assert

      expect(preLogoutHook).toHaveBeenCalledTimes(1);
      expect(postLogoutHook).toHaveBeenCalledTimes(1);
      expect(postLogoutHook).toHaveBeenCalledWith(false);
    });
  });

  describe("when requested", () => {
    it("should return empty tokens by default", async () => {
      // Arrange

      const authClient = wrapAuthClient(createMockAuthClient());

      // Assert

      expect(authClient.tokens).toStrictEqual({});
    });

    it("should return current tokens after login", async () => {
      // Arrange

      const authClientMock = createMockAuthClient();
      vi.spyOn(authClientMock, "onLogin").mockResolvedValue({
        authToken: "a.fake.tkn",
        refreshToken: "a.fake.tkn",
      });

      const authClient = wrapAuthClient(authClientMock);

      // Act

      await rtl.act(async () => {
        await authClient.login();
      });

      // Assert

      expect(authClient.tokens).toStrictEqual({
        authToken: "a.fake.tkn",
        refreshToken: "a.fake.tkn",
      });
    });
  });

  describe("when event listener is removed", () => {
    it("should not crash if no listener is defined", async () => {
      // Arrange

      const authClient = wrapAuthClient(createMockAuthClient());

      const initSuccessEventListener = vi.fn();

      // Assert

      expect(() => {
        authClient.off("initSuccess", initSuccessEventListener);
      }).not.toThrow();

      expect(initSuccessEventListener).not.toBeCalled();
    });

    it("should not be invoked on login success", async () => {
      // Arrange

      const authClientMock = createMockAuthClient();
      vi.spyOn(authClientMock, "onLogin").mockResolvedValue({
        authToken: "tkn",
        refreshToken: "tkn",
      });

      const authClient = wrapAuthClient(authClientMock);

      const loginSuccessEventListener = vi.fn();
      authClient.on("loginSuccess", loginSuccessEventListener);

      // Act

      await rtl.act(async () => {
        await authClient.login();
      });

      authClient.off("loginSuccess", loginSuccessEventListener);

      await rtl.act(async () => {
        await authClient.login();
      });

      // Assert

      expect(loginSuccessEventListener).toHaveBeenCalledTimes(1);
    });

    it("should not be invoked on login failed", async () => {
      // Arrange

      const authClient = wrapAuthClient(createMockAuthClient());

      const loginFailureEventListener = vi.fn();
      authClient.on("loginFailed", loginFailureEventListener);

      // Act

      await rtl.act(async () => {
        await authClient.login();
      });

      authClient.off("loginFailed", loginFailureEventListener);

      await rtl.act(async () => {
        await authClient.login();
      });

      // Assert

      expect(loginFailureEventListener).toHaveBeenCalledTimes(1);
    });

    it("should not be invoked on refresh success", async () => {
      // Arrange

      const authClientMock = createMockAuthClient();
      vi.spyOn(authClientMock, "onRefresh").mockResolvedValue({
        authToken: "tkn",
        refreshToken: "tkn",
      });

      const authClient = wrapAuthClient(authClientMock);

      const refreshStartedListener = vi.fn();
      authClient.on("refreshStarted", refreshStartedListener);

      const refreshSuccessEventListener = vi.fn();
      authClient.on("refreshSuccess", refreshSuccessEventListener);

      const refreshFailureEventListener = vi.fn();
      authClient.on("refreshFailed", refreshFailureEventListener);

      // Act

      await rtl.act(() => {
        authClient.refresh();
      });

      authClient.off("refreshSuccess", refreshSuccessEventListener);
      authClient.off("refreshStarted", refreshStartedListener);
      authClient.off("refreshFailed", refreshFailureEventListener);

      await rtl.act(() => {
        authClient.refresh();
      });

      // Assert

      expect(refreshStartedListener).toHaveBeenCalledTimes(1);
      expect(refreshSuccessEventListener).toHaveBeenCalledTimes(1);
      expect(refreshFailureEventListener).toHaveBeenCalledTimes(0);
    });

    it("should not be invoked on refresh failed", async () => {
      // Arrange

      const authClientMock = createMockAuthClient();
      vi.spyOn(authClientMock, "onRefresh").mockRejectedValue(null);

      const authClient = wrapAuthClient(authClientMock);

      const refreshStartedListener = vi.fn();
      authClient.on("refreshStarted", refreshStartedListener);

      const refreshSuccessEventListener = vi.fn();
      authClient.on("refreshSuccess", refreshSuccessEventListener);

      const refreshFailureEventListener = vi.fn();
      authClient.on("refreshFailed", refreshFailureEventListener);

      // Act

      await rtl.act(() => {
        authClient.refresh();
      });

      authClient.off("refreshSuccess", refreshSuccessEventListener);
      authClient.off("refreshStarted", refreshStartedListener);
      authClient.off("refreshFailed", refreshFailureEventListener);

      await rtl.act(() => {
        authClient.refresh();
      });

      // Assert

      expect(refreshStartedListener).toHaveBeenCalledTimes(1);
      expect(refreshSuccessEventListener).toHaveBeenCalledTimes(0);
      expect(refreshFailureEventListener).toHaveBeenCalledTimes(1);
    });
  });
});
