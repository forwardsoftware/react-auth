# @forward-software/react-auth-apple

> Apple Sign-In adapter for [@forward-software/react-auth](https://github.com/forwardsoftware/react-auth) - Web and React Native

[![license](https://img.shields.io/github/license/forwardsoftware/react-auth.svg)](https://github.com/forwardsoftware/react-auth/blob/main/LICENSE) [![Build & Test](https://github.com/forwardsoftware/react-auth/actions/workflows/build-test.yml/badge.svg)](https://github.com/forwardsoftware/react-auth/actions/workflows/build-test.yml) [![Github Issues](https://img.shields.io/github/issues/forwardsoftware/react-auth.svg)](https://github.com/forwardsoftware/react-auth/issues)

[![npm](https://img.shields.io/npm/v/@forward-software/react-auth-apple)](https://npmjs.com/package/@forward-software/react-auth-apple) [![NPM downloads](https://img.shields.io/npm/dm/@forward-software/react-auth-apple.svg)](https://npmjs.com/package/@forward-software/react-auth-apple)

Self-contained Apple Sign-In integration with no external auth wrapper dependencies. Provides a ready-made `AuthClient` implementation and a drop-in `AppleSignInButton` for both platforms.

## Installation

```bash
npm install @forward-software/react-auth-apple @forward-software/react-auth
# or
pnpm add @forward-software/react-auth-apple @forward-software/react-auth
```

### React Native (Expo)

This package includes an Expo native module. You need a **development build** (not Expo Go):

```bash
npx expo prebuild
npx expo run:ios
```

No additional CocoaPods are required -- Apple Sign-In uses the system `AuthenticationServices` framework.

## Quick Start

### Web

```tsx
import { createAuth } from '@forward-software/react-auth';
import { AppleAuthClient, AppleSignInButton } from '@forward-software/react-auth-apple';

const appleClient = new AppleAuthClient({
  clientId: 'com.example.service', // Your Apple Services ID
  redirectURI: 'https://example.com/auth/apple/callback',
});

const { AuthProvider, useAuthClient } = createAuth(appleClient);

function App() {
  return (
    <AuthProvider>
      <LoginScreen />
    </AuthProvider>
  );
}

function LoginScreen() {
  const auth = useAuthClient();

  return (
    <AppleSignInButton
      config={{
        clientId: 'com.example.service',
        redirectURI: 'https://example.com/auth/apple/callback',
      }}
      onCredential={(credentials) => auth.login(credentials)}
      onError={(error) => console.error(error)}
    />
  );
}
```

### React Native

```tsx
import { createAuth } from '@forward-software/react-auth';
import { AppleAuthClient, AppleSignInButton } from '@forward-software/react-auth-apple';
import { MMKV } from 'react-native-mmkv';

const mmkv = new MMKV();
const storage = {
  getItem: (key: string) => mmkv.getString(key) ?? null,
  setItem: (key: string, value: string) => mmkv.set(key, value),
  removeItem: (key: string) => mmkv.delete(key),
};

const appleClient = new AppleAuthClient({
  clientId: 'com.example.app',
  storage,
});

const { AuthProvider, useAuthClient } = createAuth(appleClient);

function LoginScreen() {
  const auth = useAuthClient();

  return (
    <AppleSignInButton
      config={{ clientId: 'com.example.app', storage }}
      onCredential={(credentials) => auth.login(credentials)}
      onError={(error) => console.error(error)}
    />
  );
}
```

## Web Setup

1. Register a **Services ID** in the [Apple Developer Console](https://developer.apple.com/account/resources/identifiers/list/serviceId)
2. Configure the **Sign in with Apple** capability with your domain and redirect URL
3. Pass the Services ID as `clientId` and your registered redirect URL as `redirectURI`

## React Native Setup

### iOS

No additional setup is needed beyond enabling the **Sign in with Apple** capability in your Xcode project:

1. Open your project in Xcode
2. Go to **Signing & Capabilities**
3. Click **+ Capability** and add **Sign in with Apple**

### Android

Apple Sign-In on Android uses a web-based OAuth flow via Chrome Custom Tabs. Because Apple uses `response_mode=form_post`, a **backend proxy** is required to receive Apple's POST response and redirect it back to your app via a deep link.

#### How it works

1. The app opens a Chrome Custom Tab pointing to Apple's authorization page
2. The user signs in on Apple's page
3. Apple **POSTs** the `id_token` and `code` to your registered redirect URI (your backend)
4. Your backend extracts the tokens from the POST body and redirects to your app using a deep link
5. The app receives the deep link, calls `handleCallback()`, and the sign-in promise resolves

#### 1. Apple Developer Console

You need a **Services ID** (separate from your App ID):

1. Go to [Certificates, Identifiers & Profiles](https://developer.apple.com/account/resources/identifiers/list/serviceId)
2. Create or select a **Services ID** (e.g., `com.example.app.service`)
3. Enable **Sign in with Apple** and click **Configure**
4. Set the **Primary App ID** to your app (it must have Sign in with Apple capability enabled)
5. Add your backend's **Domain** (e.g., `api.example.com`)
6. Add the **Return URL** pointing to your backend callback endpoint (e.g., `https://api.example.com/auth/apple/callback`)

#### 2. Backend proxy

A minimal Express server that receives Apple's POST and redirects to your app:

```js
const express = require('express');
const app = express();

const APP_SCHEME = 'myapp'; // Your app's URL scheme

app.use(express.urlencoded({ extended: true }));

app.post('/auth/apple/callback', (req, res) => {
  const { id_token, code, state, user } = req.body;

  const params = new URLSearchParams();
  if (id_token) params.set('id_token', id_token);
  if (code) params.set('code', code);
  if (state) params.set('state', state);
  if (user) params.set('user', user);

  // Redirect to the app via deep link
  res.redirect(302, `${APP_SCHEME}://auth/apple?${params.toString()}`);
});

app.listen(3000);
```

#### 3. App URL scheme

Make sure your app has a URL scheme configured in `app.json`:

```json
{
  "expo": {
    "scheme": "myapp"
  }
}
```

#### 4. Deep link handler

Create a route to handle the callback deep link. With Expo Router, add a file at `app/auth/apple.tsx`:

```tsx
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { AppleSignInModule } from '@forward-software/react-auth-apple';

export default function AppleCallback() {
  const params = useLocalSearchParams<{ id_token?: string; code?: string; user?: string }>();

  useEffect(() => {
    if (Platform.OS === 'android' && params.id_token) {
      AppleSignInModule.handleCallback({
        id_token: params.id_token,
        code: params.code,
        user: params.user,
      });
    }
    router.replace('/login');
  }, [params]);

  return null;
}
```

When the deep link `myapp://auth/apple?id_token=...&code=...` arrives, Expo Router matches it to this route. The route calls `handleCallback()` to resolve the pending sign-in promise, then navigates to the login screen where the auth state updates.

#### 5. App configuration

Pass the `androidRedirectUri` in both the client and button config. On Android, use the Services ID as `clientId` (not your app bundle ID):

```tsx
import { Platform } from 'react-native';

const ANDROID_REDIRECT_URI = 'https://api.example.com/auth/apple/callback';

const appleClient = new AppleAuthClient({
  clientId: Platform.OS === 'android' ? 'com.example.app.service' : 'com.example.app',
  storage,
  ...(Platform.OS === 'android' && { androidRedirectUri: ANDROID_REDIRECT_URI }),
});
```

```tsx
<AppleSignInButton
  config={{
    clientId: Platform.OS === 'android' ? 'com.example.app.service' : 'com.example.app',
    storage,
    ...(Platform.OS === 'android' && { androidRedirectUri: ANDROID_REDIRECT_URI }),
  }}
  onCredential={(credentials) => auth.login(credentials)}
  onError={(error) => console.error(error)}
/>
```

> **Note:** On iOS, the `clientId` should be your App Bundle ID. On Android, it must be the Apple Services ID since the flow uses web-based OAuth.

## Button Props

### Web (`AppleSignInButton`)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `config` | `AppleWebAuthConfig` | required | Apple Sign-In configuration |
| `onCredential` | `(credentials) => void` | required | Called with credentials on success |
| `onError` | `(error) => void` | - | Called on error |
| `color` | `'black' \| 'white' \| 'white-outline'` | `'black'` | Button color scheme |
| `type` | `'sign-in' \| 'continue' \| 'sign-up'` | `'sign-in'` | Button label type |
| `label` | `string` | Based on `type` | Custom label for localization |
| `width` | `number` | auto | Button width in pixels |
| `height` | `number` | `44` | Button height in pixels |

### React Native (`AppleSignInButton`)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `config` | `AppleNativeAuthConfig` | required | Apple Sign-In configuration |
| `onCredential` | `(credentials) => void` | required | Called with credentials on success |
| `onError` | `(error) => void` | - | Called on error |
| `style` | `StyleProp<ViewStyle>` | - | Additional button styles |
| `disabled` | `boolean` | `false` | Disable the button |
| `color` | `'black' \| 'white'` | `'black'` | Button color scheme |
| `label` | `string` | `'Sign in with Apple'` | Custom label for localization |

## Manual Integration

You can use the SDK wrapper directly for custom flows:

```ts
// Web
import { loadAppleIdScript, initializeAppleAuth, signInWithApple } from '@forward-software/react-auth-apple/web/appleid';

await loadAppleIdScript();
initializeAppleAuth({
  clientId: 'com.example.service',
  scope: 'name email',
  redirectURI: 'https://example.com/callback',
  usePopup: true,
});
const response = await signInWithApple();
```

```ts
// React Native
import { Platform } from 'react-native';
import { AppleSignInModule } from '@forward-software/react-auth-apple';

AppleSignInModule.configure({ scopes: ['name', 'email'] });
const credentials = await AppleSignInModule.signIn();

// getCredentialState is iOS-only; it rejects with UNSUPPORTED on Android
if (Platform.OS === 'ios') {
  const state = await AppleSignInModule.getCredentialState(credentials.user);
}
```

## Token Behavior

- **Identity Token**: Apple issues a JWT `identityToken` (similar to Google's `idToken`). The `exp` claim is extracted automatically for expiration tracking.
- **First Authorization Only**: Apple provides user info (email, name) only on the **first** authorization. Subsequent sign-ins return only the `identityToken` and `user` ID. Store user info on your backend after the first login.
- **Credential State**: On iOS, you can check if the user's Apple ID is still authorized via `getCredentialState()`. This is used during token refresh instead of silent re-authentication.
- **No Client-Side Refresh**: Apple does not support client-side token refresh. When the identity token expires, the user must re-authenticate.

## API Reference

### Types

- `AppleAuthTokens` - Token object stored after sign-in
- `AppleAuthCredentials` - Credentials passed to `login()`
- `AppleFullName` - Structured name (givenName, familyName, etc.)
- `AppleWebAuthConfig` - Web configuration
- `AppleNativeAuthConfig` - Native configuration
- `AppleScope` - `'name' | 'email'`
- `TokenStorage` - Storage interface for persistence

### Classes

- `AppleAuthClient` - Implements `AuthClient<AppleAuthTokens, AppleAuthCredentials>`

### Functions (Web SDK)

- `loadAppleIdScript()` - Load the Apple JS SDK
- `initializeAppleAuth(config)` - Initialize the SDK
- `signInWithApple()` - Trigger sign-in flow

### Functions (Native Module)

- `AppleSignInModule.configure(config)` - Configure the native module
- `AppleSignInModule.signIn()` - Trigger native sign-in
- `AppleSignInModule.getCredentialState(userID)` - Check credential state (iOS only)
- `AppleSignInModule.handleCallback(params)` - Complete a pending Android sign-in from a deep-link callback
- `AppleSignInModule.signOut()` - Sign out (no-op, clears JS-side storage)

## License

MIT
