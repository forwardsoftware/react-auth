# React Auth

> Simplify your Auth flow when working with React apps

[![license](https://img.shields.io/github/license/forwardsoftware/react-auth.svg)](https://github.com/forwardsoftware/react-auth/blob/main/LICENSE) [![Build & Test](https://github.com/forwardsoftware/react-auth/actions/workflows/build-test.yml/badge.svg)](https://github.com/forwardsoftware/react-auth/actions/workflows/build-test.yml) [![Github Issues](https://img.shields.io/github/issues/forwardsoftware/react-auth.svg)](https://github.com/forwardsoftware/react-auth/issues)

[![npm](https://img.shields.io/npm/v/@forward-software/react-auth)](https://npmjs.com/package/@forward-software/react-auth) [![NPM downloads](https://img.shields.io/npm/dm/@forward-software/react-auth.svg)](https://npmjs.com/package/@forward-software/react-auth)

This React package allows you to streamline the integration of user authentication flows in any React app by providing a single unified interface

---

## Install

```sh
npm install @forward-software/react-auth
```

## Setup

### Define an AuthClient

Create a new object that implements the `AuthClient` interface provided by this library. The interface includes several lifecycle methods, some of which are optional:

```ts
import type { AuthClient } from '@forward-software/react-auth';

// The type for your credentials
type AuthCredentials = {
  username: string;
  password: string;
};

// The type for your tokens
type AuthTokens = {
  authToken: string;
  refreshToken: string;
};

const authClient: AuthClient<AuthTokens, AuthCredentials> = {
  // Optional: Called when the AuthClient gets initialized
  onInit: async (): Promise<AuthTokens | null> => {
    // Implement the initialization logic for your client
    return null;
  },

  // Optional: Called after initialization completes
  onPostInit: async (): Promise<void> => {
    // Implement any post-initialization logic
  },

  // Optional: Called before login starts
  onPreLogin: async (): Promise<void> => {
    // Implement any pre-login logic
  },

  // Required: Called when login is requested
  onLogin: async (credentials?: AuthCredentials): Promise<AuthTokens> => {
    // Implement the logic required to exchange the provided credentials for user tokens
    return {
      authToken: '...',
      refreshToken: '...'
    };
  },

  // Optional: Called after login completes
  onPostLogin: async (isSuccess: boolean): Promise<void> => {
    // Implement any post-login logic
  },

  // Optional: Called before refresh starts
  onPreRefresh: async (): Promise<void> => {
    // Implement any pre-refresh logic
  },

  // Optional: Called when refresh is requested
  // The current tokens are passed as the first argument
  onRefresh: async (currentTokens: AuthTokens, minValidity?: number): Promise<AuthTokens> => {
    // Implement the logic required to refresh the current user tokens
    return {
      authToken: '...',
      refreshToken: '...'
    };
  },

  // Optional: Called after refresh completes
  onPostRefresh: async (isSuccess: boolean): Promise<void> => {
    // Implement any post-refresh logic
  },

  // Optional: Called before logout starts
  onPreLogout: async (): Promise<void> => {
    // Implement any pre-logout logic
  },

  // Optional: Called when logout is requested
  onLogout: async (): Promise<void> => {
    // Implement the logic required to invalidate the current user tokens
  },

  // Optional: Called after logout completes
  onPostLogout: async (isSuccess: boolean): Promise<void> => {
    // Implement any post-logout logic
  }
};
```

### Use the AuthClient

The `AuthClient` instance can be used directly with the `createAuth` function:

```ts
import { createAuth } from '@forward-software/react-auth';

export const { AuthProvider, useAuthClient, authClient: enhancedAuthClient } = createAuth(authClient);
```

The `createAuth` function returns:

- `AuthProvider`, the context Provider component that should wrap your app and provide access to your AuthClient
- `useAuthClient`, the hook to retrieve and interact with your AuthClient
- `authClient`, the enhanced authentication client instance

#### AuthProvider

The context Provider component that should wrap your app and provide access to your AuthClient, this component also accepts 2 additional props

- `ErrorComponent`, displayed when the AuthClient initialization fails
- `LoadingComponent`, displayed while the AuthClient is being initialized

#### EnhancedAuthClient

The `createAuth` function wraps your `AuthClient` implementation with an `EnhancedAuthClient` that provides additional functionality:

##### Properties
- `isInitialized`, a boolean indicating if the AuthClient has been initialized
- `isAuthenticated`, a boolean indicating if the login process has been successful and the user is authenticated
- `tokens`, the current tokens returned by the `login` or the `refresh` process

##### Methods
- `init()`, initialize the AuthClient (**N.B.** this shouldn't be called if using `AuthProvider` - see above)
- `login(credentials)`, start the login process
- `refresh()`, refresh the current tokens
- `logout()`, logout and invalidate the current tokens
- `on(eventName, listenerFn)`, subscribe to `eventName` events emitted by the AuthClient
- `off(eventName, listenerFn)`, unsubscribe from `eventName` events emitted by the AuthClient
- `subscribe(() => { })`, subscribe to AuthClient state changes
- `getSnapshot()`, returns the current state of the AuthClient

### React components

Setup React components to interact with the AuthClient using the `createAuth` function exported by this library

```ts
import { createAuth } from '@forward-software/react-auth';

export const { AuthProvider, useAuthClient } = createAuth(authClient);
```

the `createAuth` function returns:

- `AuthProvider`, the context Provider component that should wrap your app and provide access to your AuthClient
- `useAuthClient`, the hook to retrieve and interact with your AuthClient

#### AuthProvider

The context Provider component that should wrap your app and provide access to your AuthClient, this component also accepts 2 additional props

- `ErrorComponent`, displayed when the AuthClient initialization fails
- `LoadingComponent`, displayed while the AuthClient is being initialized

## Examples

The `examples` folder contains some examples of how you can integrate this library in your React app.

## Credits

This library has been inspired by [`react-keycloak`](https://github.com/react-keycloak/react-keycloak) and similar libraries.

## License

MIT

---

Made with ✨ & ❤️ by [ForWarD Software](https://github.com/forwardsoftware) and [contributors](https://github.com/forwardsoftware/react-auth/graphs/contributors)

If you found this project to be helpful, please consider contacting us to develop your React and React Native projects.
