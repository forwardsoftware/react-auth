import { requireNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';
import type { AppleAuthCredentials, AppleNativeAuthConfig } from '../types';

type AppleCredentialState = 'authorized' | 'revoked' | 'notFound' | 'transferred';

type NativeAppleSignInModule = {
  configure(config: {
    scopes?: string[];
    nonce?: string;
    clientId?: string;
    redirectUri?: string;
    state?: string;
  }): void;

  signIn(): Promise<AppleAuthCredentials>;
  getCredentialState(userID: string): Promise<AppleCredentialState>;
  signOut(): Promise<void>;
  handleCallback(params: { id_token: string; code?: string; user?: string }): void;
};

const NativeModule = requireNativeModule<NativeAppleSignInModule>('AppleSignIn');

export function configure(config: AppleNativeAuthConfig): void {
  const nativeConfig: { scopes?: string[]; nonce?: string; clientId?: string; redirectUri?: string; state?: string } = {
    scopes: config.scopes,
    nonce: config.nonce,
  };

  if (Platform.OS === 'android') {
    nativeConfig.clientId = config.clientId;
    nativeConfig.redirectUri = config.androidRedirectUri;
    nativeConfig.state = config.state;
  }

  NativeModule.configure(nativeConfig);
}

export function signIn(): Promise<AppleAuthCredentials> {
  return NativeModule.signIn();
}

export function getCredentialState(userID: string): Promise<AppleCredentialState> {
  return NativeModule.getCredentialState(userID);
}

export function signOut(): Promise<void> {
  return NativeModule.signOut();
}

export type HandleCallbackParams = {
  id_token: string;
  code?: string;
  user?: string;
};

/**
 * Complete a pending Android sign-in from a deep-link callback.
 * Call this from your app's deep link handler after the backend redirects
 * with the Apple Sign-In response parameters.
 */
export function handleCallback(params: HandleCallbackParams): void {
  return NativeModule.handleCallback(params);
}
