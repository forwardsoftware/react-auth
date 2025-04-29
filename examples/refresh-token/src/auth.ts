import { createAuth, type AuthClient } from "@forward-software/react-auth";
import axios, { AxiosInstance } from "axios";
import isJwtTokenExpired from "jwt-check-expiry";

type Tokens = Partial<{
  accessToken: string;
  refreshToken: string;
}>;

type Credentials = {
  username: string;
  password: string;
};

class MyAuthClient implements AuthClient<Tokens, Credentials> {
  private axiosAuthClient: AxiosInstance | null = null;

  async onInit() {
    this.axiosAuthClient = axios.create({
      baseURL: import.meta.env.VITE_BASE_URL,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // get tokens from persisted state (localstorage....)
    const tokens = localStorage.getItem("tokens");

    if (tokens) {
      return JSON.parse(tokens);
    }

    return null;
  }

  async onLogin(credentials?: Credentials): Promise<Tokens> {
    if (!this.axiosAuthClient) {
      return Promise.reject("axios client not initialized!");
    }

    // Replace auth/login with your url without the domain
    const payload = await this.axiosAuthClient.post("auth/login", {
      username: credentials?.username,
      password: credentials?.password,
    });

    localStorage.setItem("tokens", JSON.stringify(payload.data.data));

    return payload.data.data;
  }

  async onRefresh(currentTokens: Tokens): Promise<Tokens> {
    if (!this.axiosAuthClient) {
      return Promise.reject("axios client not initialized!");
    }

    if (!!currentTokens.accessToken && !isJwtTokenExpired(currentTokens.accessToken)) {
      return currentTokens;
    }

    const payload = await this.axiosAuthClient.post(
      // Replace jwt/refresh with your url without the domain
      "jwt/refresh",
      {
        refreshToken: currentTokens.refreshToken,
      },
      {
        headers: {
          Authorization: `Bearer ${currentTokens.accessToken}`,
        },
      }
    );

    localStorage.setItem("tokens", JSON.stringify(payload.data.data));
    return payload.data.data;
  }

  onLogout(): Promise<void> {
    localStorage.removeItem("tokens");
    // If you need to call an API to logout, just use the onLogin code to do your stuff
    return Promise.resolve();
  }
}

export const { AuthProvider, authClient, useAuthClient } = createAuth(new MyAuthClient());
