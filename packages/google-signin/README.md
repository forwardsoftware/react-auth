# React Auth - Google Sign-In

> Google Sign-In adapter for [@forward-software/react-auth](https://github.com/forwardsoftware/react-auth) - Web and React Native

Self-contained Google Sign-In integration with no external auth wrapper dependencies. Provides a ready-made `AuthClient` implementation and a drop-in `GoogleSignInButton` for both platforms.

---

## Install

```sh
npm install @forward-software/react-auth @forward-software/react-auth-google
```

### Platform requirements

**Web** - No additional dependencies. The package loads Google Identity Services (GSI) script automatically.

**React Native / Expo** - Requires a development build (not compatible with Expo Go):

- iOS: Add the `GoogleSignIn` CocoaPod (included automatically via autolinking)
- Android: Uses Android Credential Manager with Google Identity (included via `build.gradle`)
- Run `npx expo prebuild` or use EAS Build to compile native code

---

## Quick Start

### 1. Create the auth client

The setup is identical on both platforms - the bundler automatically resolves the correct implementation.

```ts
// auth.ts
import { createAuth } from '@forward-software/react-auth';
import { GoogleAuthClient } from '@forward-software/react-auth-google';

const googleAuth = new GoogleAuthClient({
  clientId: 'YOUR_GOOGLE_CLIENT_ID',
});

export const { AuthProvider, authClient, useAuthClient } = createAuth(googleAuth);
```

### 2. Wrap your app with AuthProvider

```tsx
// App.tsx
import { AuthProvider } from './auth';

function App() {
  return (
    <AuthProvider>
      <YourApp />
    </AuthProvider>
  );
}
```

### 3. Add the sign-in button

```tsx
import { GoogleSignInButton } from '@forward-software/react-auth-google';
import { useAuthClient } from './auth';

function LoginScreen() {
  const authClient = useAuthClient();

  return (
    <GoogleSignInButton
      config={{ clientId: 'YOUR_GOOGLE_CLIENT_ID' }}
      onCredential={(credentials) => authClient.login(credentials)}
      onError={(err) => console.error(err)}
    />
  );
}
```

That's it - the button handles the full Google Sign-In flow and the auth client manages tokens, persistence, and state.

---

## Web Setup

### Configuration

```ts
import { GoogleAuthClient } from '@forward-software/react-auth-google';

const googleAuth = new GoogleAuthClient({
  clientId: 'YOUR_GOOGLE_CLIENT_ID',

  // Optional
  scopes: ['openid', 'profile', 'email'],  // default
  persistTokens: true,                       // default - stores tokens in localStorage
  storageKey: '@react-auth/google-tokens',   // default
  ux_mode: 'popup',                          // 'popup' | 'redirect'
  redirect_uri: undefined,                   // required if ux_mode is 'redirect'
  hosted_domain: undefined,                  // restrict to a G Suite domain
});
```

### Custom storage

By default, the web adapter uses `localStorage`. You can provide a custom storage:

```ts
const googleAuth = new GoogleAuthClient({
  clientId: 'YOUR_GOOGLE_CLIENT_ID',
  storage: {
    getItem: (key) => sessionStorage.getItem(key),
    setItem: (key, value) => sessionStorage.setItem(key, value),
    removeItem: (key) => sessionStorage.removeItem(key),
  },
});
```

### GoogleSignInButton (Web)

Renders Google's official branded sign-in button via the GSI script.

```tsx
<GoogleSignInButton
  config={{ clientId: 'YOUR_GOOGLE_CLIENT_ID' }}
  onCredential={(credentials) => authClient.login(credentials)}
  onError={(err) => console.error(err)}

  // Optional - Google button customization
  theme="outline"        // 'outline' | 'filled_blue' | 'filled_black'
  size="large"           // 'large' | 'medium' | 'small'
  text="signin_with"     // 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
  shape="rectangular"    // 'rectangular' | 'pill' | 'circle' | 'square'
  width={300}
/>
```

### Manual integration (without GoogleSignInButton)

If you prefer full control over the UI, use the GSI utilities directly:

```tsx
import { useEffect, useRef } from 'react';
import { loadGsiScript, initializeGsi, renderGsiButton } from '@forward-software/react-auth-google/web/gsi';
import { useAuthClient } from './auth';

function CustomLogin() {
  const authClient = useAuthClient();
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function setup() {
      await loadGsiScript();
      initializeGsi({
        client_id: 'YOUR_GOOGLE_CLIENT_ID',
        callback: (response) => {
          authClient.login({ idToken: response.credential });
        },
      });
      if (buttonRef.current) {
        renderGsiButton(buttonRef.current, { theme: 'outline', size: 'large' });
      }
    }
    setup();
  }, []);

  return <div ref={buttonRef} />;
}
```

### Token refresh on web

Google Identity Services on the web does **not** provide refresh tokens. When the ID token expires, the user must sign in again. The adapter handles this automatically - `onInit()` returns `null` when stored tokens are expired, which transitions the auth state to unauthenticated.

---

## React Native / Expo Setup

### Configuration

```ts
import { GoogleAuthClient } from '@forward-software/react-auth-google';
import { MMKV } from 'react-native-mmkv';

const mmkv = new MMKV();

const googleAuth = new GoogleAuthClient({
  clientId: 'YOUR_GOOGLE_CLIENT_ID',
  webClientId: 'YOUR_WEB_CLIENT_ID',       // required for ID token retrieval on Android
  iosClientId: 'YOUR_IOS_CLIENT_ID',       // iOS-specific client ID (if different)

  // Required on React Native - no default storage
  storage: {
    getItem: (key) => mmkv.getString(key) ?? null,
    setItem: (key, value) => mmkv.set(key, value),
    removeItem: (key) => mmkv.delete(key),
  },

  // Optional
  scopes: ['openid', 'profile', 'email'],
  persistTokens: true,
  storageKey: '@react-auth/google-tokens',
  offlineAccess: false,
});
```

> **Note:** On React Native, a `storage` adapter is **required**. The adapter throws an error if none is provided. Use [react-native-mmkv](https://github.com/mrousavy/react-native-mmkv) (recommended) or wrap AsyncStorage with the `TokenStorage` interface.

### GoogleSignInButton (React Native)

Renders a styled button that triggers the native Google Sign-In flow.

```tsx
<GoogleSignInButton
  config={{
    clientId: 'YOUR_GOOGLE_CLIENT_ID',
    webClientId: 'YOUR_WEB_CLIENT_ID',
    storage: myStorage,
  }}
  onCredential={(credentials) => authClient.login(credentials)}
  onError={(err) => Alert.alert('Error', err.message)}
  style={{ marginTop: 20 }}
  disabled={false}
/>
```

### Manual integration (without GoogleSignInButton)

```tsx
import { GoogleSignInModule } from '@forward-software/react-auth-google';
import { useAuthClient } from './auth';

function LoginScreen() {
  const authClient = useAuthClient();

  const handleSignIn = async () => {
    try {
      const credentials = await GoogleSignInModule.signIn();
      await authClient.login(credentials);
    } catch (err) {
      console.error(err);
    }
  };

  return <Button title="Sign in with Google" onPress={handleSignIn} />;
}
```

### Token refresh on React Native

The native adapter implements `onRefresh()` which calls `signInSilently()` to refresh tokens without user interaction. This is handled automatically by the react-auth core library when you call `authClient.refresh()`.

---

## Google Cloud Console Setup

To use Google Sign-In, you need OAuth 2.0 credentials from the [Google Cloud Console](https://console.cloud.google.com/apis/credentials):

1. Create a new project (or use an existing one)
2. Navigate to **APIs & Services > Credentials**
3. Click **Create Credentials > OAuth client ID**

### For Web

- Application type: **Web application**
- Add your domain to **Authorized JavaScript origins** (e.g., `http://localhost:3000` for development)
- Copy the **Client ID** - this is your `clientId`

### For iOS

- Application type: **iOS**
- Enter your app's **Bundle ID**
- Copy the **Client ID** - this is your `iosClientId`
- Add the reversed client ID as a URL scheme in your `Info.plist`

### For Android

- Application type: **Android**
- Enter your app's **Package name** and **SHA-1 certificate fingerprint**
- For the `webClientId`, use the **Web application** client ID (not the Android one)

---

## API Reference

### Types

```ts
type GoogleAuthTokens = {
  idToken: string;
  accessToken?: string;
  refreshToken?: string;
  serverAuthCode?: string;
  expiresAt?: number;
};

type GoogleAuthCredentials = {
  idToken: string;
  accessToken?: string;
  serverAuthCode?: string;
};

interface TokenStorage {
  getItem(key: string): string | null | Promise<string | null>;
  setItem(key: string, value: string): void | Promise<void>;
  removeItem(key: string): void | Promise<void>;
}
```

### GoogleAuthClient

Implements `AuthClient<GoogleAuthTokens, GoogleAuthCredentials>` from `@forward-software/react-auth`.

| Method | Web | Native | Description |
|--------|-----|--------|-------------|
| `onInit()` | Yes | Yes | Restores tokens from storage. Configures native module on RN. |
| `onLogin(credentials)` | Yes | Yes | Validates and persists tokens from Google Sign-In result. |
| `onRefresh(tokens)` | No | Yes | Refreshes tokens via silent sign-in (native only). |
| `onLogout()` | Yes | Yes | Clears tokens. Calls native signOut on RN. |

### GoogleSignInButton

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `config` | `GoogleWebAuthConfig` / `GoogleNativeAuthConfig` | Yes | Google Sign-In configuration |
| `onCredential` | `(credentials: GoogleAuthCredentials) => void` | Yes | Called with credentials after successful sign-in |
| `onError` | `(error: Error) => void` | No | Called when sign-in fails |
| `theme` | `'outline' \| 'filled_blue' \| 'filled_black'` | No | Button theme (web only) |
| `size` | `'large' \| 'medium' \| 'small'` | No | Button size (web only) |
| `text` | `'signin_with' \| 'signup_with' \| 'continue_with' \| 'signin'` | No | Button text (web only) |
| `shape` | `'rectangular' \| 'pill' \| 'circle' \| 'square'` | No | Button shape (web only) |
| `width` | `number` | No | Button width in pixels (web only) |
| `style` | `ViewStyle` | No | Custom styles (native only) |
| `disabled` | `boolean` | No | Disable the button (native only) |

### GoogleSignInModule (Native only)

Available via `import { GoogleSignInModule } from '@forward-software/react-auth-google'` on React Native.

| Method | Description |
|--------|-------------|
| `configure(config)` | Initialize the native Google Sign-In SDK |
| `signIn()` | Present the Google account picker and return credentials |
| `signInSilently()` | Attempt sign-in without UI (for token refresh) |
| `getTokens()` | Get current tokens (refreshes if needed) |
| `signOut()` | Sign out the current user |

---

## License

MIT

---

Made with ✨ & ❤️ by [ForWarD Software](https://github.com/forwardsoftware) and [contributors](https://github.com/forwardsoftware/react-auth/graphs/contributors)
