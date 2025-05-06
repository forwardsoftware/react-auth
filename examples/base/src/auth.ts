import { createAuth } from "@forward-software/react-auth";
import type { AuthClient } from "@forward-software/react-auth";

type AuthCredentials = {};

type AuthTokens = {
  authToken: string;

  refreshToken: string;
};

class MyAuthClient implements AuthClient<AuthTokens, AuthCredentials> {
  onLogin(): Promise<AuthTokens> {
    return new Promise((resolve) => {
      setTimeout(
        () =>
          resolve({
            authToken: "auth.token",
            refreshToken: "refresh.token",
          }),
        2000
      );
    });
  }

  onRefresh(): Promise<AuthTokens> {
    return new Promise((resolve) => {
      setTimeout(
        () =>
          resolve({
            authToken: "new.auth.token",
            refreshToken: "new.refresh.token",
          }),
        2000
      );
    });
  }
}

const myAuthClient = new MyAuthClient();

export const { AuthProvider, authClient, useAuthClient } = createAuth(myAuthClient);
