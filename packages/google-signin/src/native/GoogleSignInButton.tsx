import React, { useState, useCallback } from 'react';
import type { GoogleAuthCredentials, GoogleNativeAuthConfig } from '../types';
import * as GoogleSignInModule from './GoogleSignInModule';

type GoogleSignInButtonProps = {
  config: GoogleNativeAuthConfig;
  onCredential: (credentials: GoogleAuthCredentials) => void;
  onError?: (error: Error) => void;
  style?: Record<string, unknown>;
  disabled?: boolean;
};

export function GoogleSignInButton({
  config,
  onCredential,
  onError,
  style,
  disabled = false,
}: GoogleSignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handlePress = useCallback(async () => {
    if (isLoading || disabled) return;

    setIsLoading(true);
    try {
      const credentials = await GoogleSignInModule.signIn();
      onCredential(credentials);
    } catch (err) {
      onError?.(
        err instanceof Error ? err : new Error('Google Sign-In failed')
      );
    } finally {
      setIsLoading(false);
    }
  }, [config, onCredential, onError, isLoading, disabled]);

  // Import React Native components dynamically to avoid issues on web
  const { View, Text, Pressable, ActivityIndicator } = require('react-native');

  return (
    <Pressable
      onPress={handlePress}
      disabled={isLoading || disabled}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#ffffff',
          borderRadius: 4,
          borderWidth: 1,
          borderColor: '#dadce0',
          paddingHorizontal: 12,
          paddingVertical: 10,
          minHeight: 40,
          opacity: isLoading || disabled ? 0.6 : 1,
        },
        style,
      ]}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color="#4285F4" />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <GoogleLogo />
          <Text
            style={{
              marginLeft: 8,
              fontSize: 14,
              fontWeight: '500',
              color: '#3c4043',
            }}
          >
            Sign in with Google
          </Text>
        </View>
      )}
    </Pressable>
  );
}

/**
 * Minimal Google "G" logo rendered as colored text.
 * For production, consider using an SVG or image asset.
 */
function GoogleLogo() {
  const { Text } = require('react-native');

  return (
    <Text
      style={{
        fontSize: 18,
        fontWeight: '700',
        color: '#4285F4',
      }}
    >
      G
    </Text>
  );
}
