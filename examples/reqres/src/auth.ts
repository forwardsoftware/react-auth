import { createAuth, type AuthClient } from "@forward-software/react-auth";
import axios from "axios";

type ReqResCredentials = {
  email: string;

  password: string;
};

type ReqResAuthTokens = {
  token: string;
};

class ReqResAuthClient implements AuthClient<ReqResAuthTokens, ReqResCredentials> {
  private _apiClient = axios.create({
    baseURL: "https://reqres.in",
    headers: {
      "x-api-key": "reqres-free-v1",
    },
  });

  async onLogin(credentials: ReqResCredentials): Promise<ReqResAuthTokens> {
    if (!credentials) {
      throw new Error("Invalid credentials");
    }

    const { data } = await this._apiClient.post("api/login", {
      email: credentials.email,
      password: credentials.password,
    });

    return {
      token: data.token,
    };
  }
}

export const { AuthProvider, authClient, useAuthClient } = createAuth(new ReqResAuthClient());
