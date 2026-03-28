import React, { useEffect, useRef, useCallback, useState } from 'react';
import type { AppleAuthCredentials, AppleWebAuthConfig } from '../types';
import { DEFAULT_SCOPES } from '../types';
import { AppleLogo } from '../AppleLogo';
import { loadAppleIdScript, initializeAppleAuth, signInWithApple } from './appleid';

type AppleSignInButtonColor = 'black' | 'white' | 'white-outline';
type AppleSignInButtonType = 'sign-in' | 'continue' | 'sign-up';

type AppleSignInButtonProps = {
  config: AppleWebAuthConfig;
  onCredential: (credentials: AppleAuthCredentials) => void;
  onError?: (error: Error) => void;
  color?: AppleSignInButtonColor;
  type?: AppleSignInButtonType;
  /** Button label text. Defaults based on `type` prop. Pass a custom string for localization. */
  label?: string;
  width?: number;
  height?: number;
};

const DEFAULT_LABELS: Record<AppleSignInButtonType, string> = {
  'sign-in': 'Sign in with Apple',
  'continue': 'Continue with Apple',
  'sign-up': 'Sign up with Apple',
};

const BUTTON_STYLES: Record<AppleSignInButtonColor, { bg: string; text: string; border: string }> = {
  'black': { bg: '#000000', text: '#ffffff', border: '#000000' },
  'white': { bg: '#ffffff', text: '#000000', border: '#ffffff' },
  'white-outline': { bg: '#ffffff', text: '#000000', border: '#000000' },
};

export function AppleSignInButton({
  config,
  onCredential,
  onError,
  color = 'black',
  type = 'sign-in',
  label,
  width,
  height = 44,
}: AppleSignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const onCredentialRef = useRef(onCredential);
  const onErrorRef = useRef(onError);

  onCredentialRef.current = onCredential;
  onErrorRef.current = onError;

  const displayLabel = label ?? DEFAULT_LABELS[type];
  const style = BUTTON_STYLES[color];

  const initialize = useCallback(async () => {
    try {
      await loadAppleIdScript();

      const scopes = (config.scopes ?? DEFAULT_SCOPES).join(' ');
      initializeAppleAuth({
        clientId: config.clientId,
        scope: scopes,
        redirectURI: config.redirectURI,
        state: config.state,
        nonce: config.nonce,
        usePopup: config.usePopup,
      });
    } catch (err) {
      onErrorRef.current?.(
        err instanceof Error ? err : new Error('Failed to initialize Apple Sign-In')
      );
    }
  }, [config.clientId, config.scopes, config.redirectURI, config.state, config.nonce, config.usePopup]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const handleClick = useCallback(async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const response = await signInWithApple();

      const credentials: AppleAuthCredentials = {
        identityToken: response.authorization.id_token,
        authorizationCode: response.authorization.code,
        email: response.user?.email,
        fullName: response.user?.name
          ? {
              givenName: response.user.name.firstName,
              familyName: response.user.name.lastName,
            }
          : undefined,
      };

      onCredentialRef.current(credentials);
    } catch (err) {
      const error = err instanceof Error
        ? err
        : new Error(typeof err === 'object' && err !== null ? JSON.stringify(err) : 'Apple Sign-In failed');
      onErrorRef.current?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: style.bg,
        color: style.text,
        border: `1px solid ${style.border}`,
        borderRadius: 6,
        padding: '0 16px',
        height,
        width: width ?? 'auto',
        cursor: isLoading ? 'default' : 'pointer',
        opacity: isLoading ? 0.6 : 1,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSize: 16,
        fontWeight: 500,
        lineHeight: 1,
      }}
    >
      <AppleLogo color={style.text} />
      {displayLabel}
    </button>
  );
}
