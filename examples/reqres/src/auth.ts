import axios from 'axios';
import { BaseAuthClient, createAuth } from '@forward-software/react-auth';

type ReqResCredentials = {
  email: string;

  password: string;
};

type ReqResAuthTokens = {
  token: string;
};

class ReqResAuthClient extends BaseAuthClient<
  ReqResAuthTokens,
  ReqResCredentials
> {
  private _apiClient = axios.create({
    baseURL: 'https://reqres.in',
    headers: {
      "x-api-key": "reqres-free-v1"
    }
  });

  protected onInit(): Promise<void> {
    return Promise.resolve();
  }

  protected async onLogin(
    credentials?: ReqResCredentials
  ): Promise<ReqResAuthTokens> {
    if (!credentials) {
      throw new Error('Invalid credentials');
    }

    const { data } = await this._apiClient.post('api/login', {
      email: credentials.email,
      password: credentials.password,
    });

    return {
      token: data.token,
    };
  }

  protected onRefresh(minValidity?: number): Promise<ReqResAuthTokens> {
    throw new Error('Unsupported method!');
  }

  protected onLogout(): Promise<void> {
    return Promise.resolve();
  }

  public async register(credentials: ReqResCredentials): Promise<void> {
    let tokens: ReqResAuthTokens | undefined = undefined;

    try {
      const { data } = await this._apiClient.post('/api/register', {
        email: credentials.email,
        password: credentials.password,
      });

      tokens = {
        token: data.token,
      };
    } catch (err) {
      console.error('Register call failed', err);
    }

    this.setState({
      isAuthenticated: !!tokens,
      tokens,
    });
  }
}

export const authClient = new ReqResAuthClient();

export const { AuthProvider, useAuthClient } = createAuth(authClient);
