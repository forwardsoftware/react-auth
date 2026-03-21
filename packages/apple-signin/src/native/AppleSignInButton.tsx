import React, { useState, useCallback } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { AppleAuthCredentials, AppleNativeAuthConfig } from '../types';
import * as AppleSignInModule from './AppleSignInModule';

type AppleSignInButtonColor = 'black' | 'white';

type AppleSignInButtonProps = {
  config: AppleNativeAuthConfig;
  onCredential: (credentials: AppleAuthCredentials) => void;
  onError?: (error: Error) => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  color?: AppleSignInButtonColor;
  /** Button label text. Defaults to "Sign in with Apple". Pass a custom string for localization. */
  label?: string;
};

export function AppleSignInButton({
  config,
  onCredential,
  onError,
  style,
  disabled = false,
  color = 'black',
  label = 'Sign in with Apple',
}: AppleSignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const isBlack = color === 'black';

  const handlePress = useCallback(async () => {
    if (isLoading || disabled) return;

    setIsLoading(true);
    try {
      AppleSignInModule.configure(config);
      const credentials = await AppleSignInModule.signIn();
      onCredential(credentials);
    } catch (err) {
      onError?.(
        err instanceof Error ? err : new Error('Apple Sign-In failed')
      );
    } finally {
      setIsLoading(false);
    }
  }, [config, onCredential, onError, isLoading, disabled]);

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
          backgroundColor: isBlack ? '#000000' : '#ffffff',
          borderRadius: 6,
          borderWidth: 1,
          borderColor: '#000000',
          paddingHorizontal: 12,
          paddingVertical: 10,
          minHeight: 44,
          opacity: isLoading || disabled ? 0.6 : 1,
        },
        style,
      ]}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={isBlack ? '#ffffff' : '#000000'} />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <AppleLogo color={isBlack ? '#ffffff' : '#000000'} />
          <Text
            style={{
              marginLeft: 8,
              fontSize: 16,
              fontWeight: '500',
              color: isBlack ? '#ffffff' : '#000000',
            }}
          >
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

function AppleLogo({ color }: { color: string }) {
  const { Text } = require('react-native');

  return (
    <Text
      style={{
        fontSize: 20,
        fontWeight: '700',
        color,
      }}
    >
      {'\uF8FF'}
    </Text>
  );
}
