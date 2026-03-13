import React, { useEffect, useRef, useCallback } from 'react';
import type { GoogleAuthCredentials, GoogleWebAuthConfig } from '../types';
import { loadGsiScript, initializeGsi, renderGsiButton } from './gsi';
import type { GsiButtonConfig } from './gsi';

type GoogleSignInButtonProps = {
  config: GoogleWebAuthConfig;
  onCredential: (credentials: GoogleAuthCredentials) => void;
  onError?: (error: Error) => void;
  theme?: GsiButtonConfig['theme'];
  size?: GsiButtonConfig['size'];
  text?: GsiButtonConfig['text'];
  shape?: GsiButtonConfig['shape'];
  width?: number;
};

export function GoogleSignInButton({
  config,
  onCredential,
  onError,
  theme = 'outline',
  size = 'large',
  text = 'signin_with',
  shape = 'rectangular',
  width,
}: GoogleSignInButtonProps) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const onCredentialRef = useRef(onCredential);
  const onErrorRef = useRef(onError);

  onCredentialRef.current = onCredential;
  onErrorRef.current = onError;

  const initialize = useCallback(async () => {
    try {
      await loadGsiScript();

      initializeGsi({
        client_id: config.clientId,
        callback: (response) => {
          if (response.credential) {
            onCredentialRef.current({
              idToken: response.credential,
            });
          } else {
            onErrorRef.current?.(new Error('Google Sign-In did not return a credential'));
          }
        },
        ux_mode: config.ux_mode,
        login_uri: config.redirect_uri,
        hosted_domain: config.hosted_domain,
      });

      if (buttonRef.current) {
        renderGsiButton(buttonRef.current, {
          theme,
          size,
          text,
          shape,
          width,
        });
      }
    } catch (err) {
      onErrorRef.current?.(
        err instanceof Error ? err : new Error('Failed to initialize Google Sign-In')
      );
    }
  }, [config.clientId, config.ux_mode, config.redirect_uri, config.hosted_domain, theme, size, text, shape, width]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return <div ref={buttonRef} />;
}
