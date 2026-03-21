import { requireNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';
import type { AppleAuthCredentials, AppleNativeAuthConfig, AppleScope } from '../types';

type AppleCredentialState = 'authorized' | 'revoked' | 'notFound' | 'transferred';

type NativeAppleSignInModule = {
  configure(config: {
    scopes?: string[];
    nonce?: string;
  }): void;

  signIn(): Promise<AppleAuthCredentials>;
  getCredentialState(userID: string): Promise<AppleCredentialState>;
  signOut(): Promise<void>;
};

const NativeModule = requireNativeModule<NativeAppleSignInModule>('AppleSignIn');

export function configure(config: AppleNativeAuthConfig): void {
  const nativeConfig: { scopes?: string[]; nonce?: string; clientId?: string; redirectUri?: string } = {
    scopes: config.scopes,
    nonce: config.nonce,
  };

  if (Platform.OS === 'android') {
    nativeConfig.clientId = config.clientId;
    nativeConfig.redirectUri = config.androidRedirectUri;
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
