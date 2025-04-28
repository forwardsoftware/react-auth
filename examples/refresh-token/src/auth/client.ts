import { BaseAuthClient } from "@forward-software/react-auth";
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

class Client extends BaseAuthClient<Tokens, Credentials> {
  private axiosClient: AxiosInstance | null = null;

  protected async onInit(): Promise<void> {
    this.axiosClient = axios.create({
      baseURL: process.env.VITE_BASE_URL,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // get tokens from persisted state (localstorage....)
    const tokens = localStorage.getItem("tokens");

    if (tokens) {
      this.setState({
        isInitialized: true,
        isAuthenticated: true,
        tokens: JSON.parse(tokens),
      });
    }

    return Promise.resolve();
  }

  protected async onLogin(credentials?: Credentials): Promise<Tokens> {
    if (!this.axiosClient) {
      return Promise.reject("axios client not initialized!");
    }

    // Replace auth/login with your url without the domain
    const payload = await this.axiosClient.post("auth/login", {
      username: credentials?.username,
      password: credentials?.password,
    });

    localStorage.setItem("tokens", JSON.stringify(payload.data.data));
    return payload.data.data;
  }

  protected async onRefresh(): Promise<Tokens> {
    if (!this.axiosClient) {
      return Promise.reject("axios client not initialized!");
    }

    if (!!this.tokens.accessToken && !isJwtTokenExpired(this.tokens.accessToken)) return this.tokens;

    const payload = await this.axiosClient.post(
      // Replace jwt/refresh with your url without the domain
      "jwt/refresh",
      {
        refreshToken: this.tokens.refreshToken,
      },
      {
        headers: {
          Authorization: `Bearer ${this.tokens.accessToken}`,
        },
      }
    );

    localStorage.setItem("tokens", JSON.stringify(payload.data.data));
    return payload.data.data;
  }

  protected onLogout(): Promise<void> {
    localStorage.removeItem("tokens");
    // If you need to call an API to logout, just use the onLogin code to do your stuff
    return Promise.resolve();
  }
}

export default Client;
