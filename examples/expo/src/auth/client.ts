import { BASE_URL } from '@/src/constants';
import { MMKVStorage } from '@/src/utilities/mmkv';
import type { AuthClient } from '@forward-software/react-auth';
import axios, { AxiosInstance } from 'axios';
import isJwtTokenExpired from 'jwt-check-expiry';

type AuthTokens = Partial<{
  access_token: string;
  refresh_token: string;
}>;

type AuthCredentials = {
  email: string;
  password: string;
};

class MyAuthClient implements AuthClient<AuthTokens, AuthCredentials> {
  private axiosAuthClient: AxiosInstance | null = null;

  async onInit() {
    this.axiosAuthClient = axios.create({
      baseURL: BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // get tokens from persisted state (MMKV (suggested))
    const tokens = MMKVStorage.getString('tokens');

    if (tokens) {
      return JSON.parse(tokens);
    }

    return null;
  }

  async onLogin(credentials?: AuthCredentials): Promise<AuthTokens> {
    if (!this.axiosAuthClient) {
      return Promise.reject('axios client not initialized!');
    }

    // Replace auth/login with your url without the domain
    const payload = await this.axiosAuthClient.post('/v1/auth/login', {
      email: credentials?.email,
      password: credentials?.password,
    });

    // Check the response data. Sometimes it's data.data, sometimes it's data
    MMKVStorage.set('tokens', JSON.stringify(payload.data));

    return payload.data;
  }

  async onRefresh(currentTokens: AuthTokens): Promise<AuthTokens> {
    if (!this.axiosAuthClient) {
      return Promise.reject('axios client not initialized!');
    }

    if (
      !!currentTokens.access_token &&
      !isJwtTokenExpired(currentTokens.access_token)
    ) {
      return currentTokens;
    }

    const payload = await this.axiosAuthClient.post(
      // Replace jwt/refresh with your url without the domain
      '/v1/auth/refresh-token',
      {
        refreshToken: currentTokens.refresh_token,
      },
      {
        headers: {
          Authorization: `Bearer ${currentTokens.access_token}`,
        },
      }
    );

    MMKVStorage.set('tokens', JSON.stringify(payload.data));
    return payload.data;
  }

  onLogout(): Promise<void> {
    MMKVStorage.delete('tokens');
    // If you need to call an API to logout, just use the onLogin code to do your stuff
    return Promise.resolve();
  }
}

export default MyAuthClient;
