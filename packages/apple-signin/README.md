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

Apple Sign-In on Android uses a web-based OAuth flow via Chrome Custom Tabs. This requires a **backend intermediary** because Apple uses `response_mode=form_post`:

1. Your backend receives the POST from Apple at your `androidRedirectUri`
2. It extracts the `id_token` and `code` from the POST body
3. It redirects back to your app via a deep link with these parameters

```tsx
<AppleSignInButton
  config={{
    clientId: 'com.example.service',
    storage,
    androidRedirectUri: 'https://api.example.com/auth/apple/android-callback',
  }}
  onCredential={(credentials) => auth.login(credentials)}
/>
```

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
import { AppleSignInModule } from '@forward-software/react-auth-apple';

AppleSignInModule.configure({ scopes: ['name', 'email'] });
const credentials = await AppleSignInModule.signIn();
const state = await AppleSignInModule.getCredentialState(credentials.user);
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
