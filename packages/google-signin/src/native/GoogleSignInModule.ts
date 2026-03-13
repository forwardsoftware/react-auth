import { requireNativeModule } from 'expo-modules-core';
import type { GoogleAuthCredentials, GoogleNativeAuthConfig } from '../types';

type NativeGoogleSignInModule = {
  configure(config: {
    clientId: string;
    webClientId?: string;
    scopes?: string[];
    offlineAccess?: boolean;
  }): void;

  signIn(): Promise<GoogleAuthCredentials>;
  signInSilently(): Promise<GoogleAuthCredentials>;
  getTokens(): Promise<{ idToken: string; accessToken?: string }>;
  signOut(): Promise<void>;
};

const NativeModule = requireNativeModule<NativeGoogleSignInModule>('GoogleSignIn');

export function configure(config: GoogleNativeAuthConfig): void {
  NativeModule.configure({
    clientId: config.clientId,
    webClientId: config.webClientId,
    scopes: config.scopes,
    offlineAccess: config.offlineAccess,
  });
}

export function signIn(): Promise<GoogleAuthCredentials> {
  return NativeModule.signIn();
}

export function signInSilently(): Promise<GoogleAuthCredentials> {
  return NativeModule.signInSilently();
}

export function getTokens(): Promise<{ idToken: string; accessToken?: string }> {
  return NativeModule.getTokens();
}

export function signOut(): Promise<void> {
  return NativeModule.signOut();
}
