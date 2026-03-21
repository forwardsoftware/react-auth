import React, { useEffect, useRef, useCallback, useState } from 'react';
import type { AppleAuthCredentials, AppleWebAuthConfig } from '../types';
import { DEFAULT_SCOPES } from '../types';
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

const APPLE_LOGO_SVG = `data:image/svg+xml;base64,${btoa('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 17 20" fill="currentColor"><path d="M15.5 14.7c-.4.9-.6 1.3-1.1 2.1-.7 1.1-1.7 2.5-2.9 2.5-1.1 0-1.4-.7-2.9-.7-1.5 0-1.9.7-3 .7-1.2 0-2.1-1.2-2.8-2.3C1.2 14.6.5 11.4 1.6 9.2c.8-1.5 2.1-2.4 3.5-2.4 1.3 0 2.2.8 3.2.8 1 0 1.7-.8 3.1-.8 1.2 0 2.4.7 3.2 1.8-2.8 1.5-2.4 5.5.3 6.7l-.4-.6zM11.3 4.5c.5-.7.9-1.6.8-2.5-.8.1-1.7.5-2.3 1.2-.5.6-1 1.5-.8 2.4.9 0 1.7-.4 2.3-1.1z"/></svg>')}`;

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
      onErrorRef.current?.(
        err instanceof Error ? err : new Error('Apple Sign-In failed')
      );
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  return (
    <button
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
      <img
        src={APPLE_LOGO_SVG}
        alt=""
        style={{
          width: 16,
          height: 20,
          marginRight: 8,
          filter: color === 'black' ? 'invert(1)' : 'none',
        }}
      />
      {displayLabel}
    </button>
  );
}
