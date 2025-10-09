import React from 'react';
import {
  Button,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuthClient } from '@/src/auth';
import { useAsyncCallback } from '@/src/hooks/useAsyncCallback';
import { useUserCredentials } from '@/src/hooks/useUserCredentials';

export default function Home() {
  const client = useAuthClient();
  const userCredentials = useUserCredentials();

  const [onLogin, isLoginLoading] = useAsyncCallback(
    () =>
      client.login({
        email: userCredentials.email,
        password: userCredentials.password,
      }),
    [client, userCredentials]
  );

  const [onLogout, isLogoutLoading] = useAsyncCallback(
    () => client.logout(),
    [client]
  );

  const [onRefreshTokens, tokenRefreshLoading] = useAsyncCallback(
    () => client.refresh(),
    [client]
  );

  return (
    <ScrollView
      style={styles.scrollViewStyle}
      contentContainerStyle={styles.constainer}
    >
      <Text>Auth client ready? {String(client.isInitialized)}</Text>
      <Text>Auth client authenticated? {String(client.isAuthenticated)}</Text>

      <View style={styles.containerTextInput}>
        <TextInput
          autoCorrect={false}
          autoCapitalize="none"
          value={userCredentials.email}
          onChangeText={userCredentials.updateEmail}
          style={styles.textInputStyle}
          underlineColorAndroid="rgba(0,0,0,0)"
          placeholder="Insert email"
        />
        <TextInput
          autoCorrect={false}
          autoCapitalize="none"
          secureTextEntry
          value={userCredentials.password}
          onChangeText={userCredentials.updatePassword}
          style={styles.textInputStyle}
          underlineColorAndroid="rgba(0,0,0,0)"
          placeholder="Insert password"
        />
      </View>

      <View>
        <Button
          onPress={onLogin}
          disabled={client.isAuthenticated || isLoginLoading}
          title="Login"
        />

        <Button
          onPress={onLogout}
          disabled={!client.isAuthenticated || isLogoutLoading}
          title="Logout"
        />
      </View>

      {isLoginLoading ? <Text>Login in progress...</Text> : null}

      <Text>Tokens:</Text>
      <Text>
        {tokenRefreshLoading
          ? 'Refeshing tokens....'
          : JSON.stringify(client.tokens ?? {}, null, 2)}
      </Text>

      {/*
          use client.refresh() where you implement your API calls logic (eg. redux-saga, ....)
          check code in src/api/interceptors.ts and use APIClient to make call to API
        */}
      <Button
        onPress={onRefreshTokens}
        disabled={!client.isAuthenticated || tokenRefreshLoading}
        title="Refresh tokens"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollViewStyle: {
    paddingTop: 50,
  },
  constainer: {
    paddingHorizontal: 20,
  },
  containerTextInput: {
    marginTop: 20,
    gap: 15,
  },
  textInputStyle: {
    borderColor: 'grey',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
});
