# React Auth

> Simplify your Auth flow when working with React apps

[![license](https://img.shields.io/github/license/forwardsoftware/react-auth.svg)](https://github.com/forwardsoftware/react-auth/blob/main/LICENSE) [![CI](https://github.com/forwardsoftware/react-auth/actions/workflows/main.yml/badge.svg)](https://github.com/forwardsoftware/react-auth/actions/workflows/main.yml)

[![npm](https://img.shields.io/npm/v/@forward-software/react-auth)](https://npmjs.com/package/@forward-software/react-auth) [![NPM downloads](https://img.shields.io/npm/dm/@forward-software/react-auth.svg)](https://npmjs.com/package/@forward-software/react-auth)

This React package allows you to streamline the integration of user authentication flows in any React app by providing a single unified interface

---

## Install

```sh
npm install @forward-software/react-auth
```

## Setup

### Define an AuthClient class

Create a new `AuthClient` class which extends the `BaseAuthClient` provided by this library and implements the 4 required methods:

- **onInit**, called when the AuthClient gets initialized
- **onLogin**, invoked when the `login` method of the AuthClient gets called
- **onRefresh**, invoked when the `refresh` method of the AuthClient gets called
- **onLogout**, invoked when the `logout` method of the AuthClient gets called

```ts
import { BaseAuthClient } from '@forward-software/react-auth';

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

class AuthClient extends BaseAuthClient<AuthTokens, AuthCredentials> {
  protected onInit(): Promise<void> {
    // Implement the initialization logic for your client
  }

  protected onLogin(credentials?: AuthCredentials): Promise<AuthTokens> {
    // Implement the logic required to exchange the provided credentials for user tokens
  }

  protected onRefresh(minValidity?: number): Promise<AuthTokens> {
    // Implement the logic required to refresh the current user tokens
  }

  protected onLogout(): Promise<void> {
    // Implement the logic required to invalidate the current user tokens
  }
}
```

### Instantiate an AuthClient

Create an instance of the `AuthClient` class defined

```ts
const authClient = new AuthClient();
```

#### AuthClient Props

- `isInitialized`, a boolean indicating if the AuthClient has been initialized
- `isAuthenticated`, a boolean indicating if the login process has been successfull and the user is authenticated
- `tokens`, the current tokens returned by the `login` or the `refresh` process

#### AuthClient Methods

##### Core

- `init()`, initialize the AuthClient (**N.B.** this shouldn't be called if using `AuthProvider` - see below)
- `login(credentials)`, start the login process
- `refresh()`, refresh the current tokens
- `logout()`, logout and invalidate the current tokens

##### EventEmitter

- `on(eventName, listenerFn)`, subscribe to `eventName` events emitted by the AuthClient
- `off(eventName, listenerFn)`, unsubscribe from `eventName` events emitted by the AuthClient

##### Observable

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

Made with ✨ & ❤️ by [ForWarD Software](https://github.com/Forward-Software) and [contributors](https://github.com/Forward-Software/react-auth/graphs/contributors)

If you found this project to be helpful, please consider contacting us to develop your React and React Native projects.
