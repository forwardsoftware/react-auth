# React Auth

> Simplify your Auth flow when working with React apps

[![license](https://img.shields.io/github/license/forwardsoftware/react-auth.svg)](https://github.com/forwardsoftware/react-auth/blob/main/LICENSE) [![Build & Test](https://github.com/forwardsoftware/react-auth/actions/workflows/build-test.yml/badge.svg)](https://github.com/forwardsoftware/react-auth/actions/workflows/build-test.yml) [![Github Issues](https://img.shields.io/github/issues/forwardsoftware/react-auth.svg)](https://github.com/forwardsoftware/react-auth/issues)

## Packages

This monorepo contains the following packages:

| Package | Version | Description |
| --- | --- | --- |
| [`@forward-software/react-auth`](./lib) | [![npm](https://img.shields.io/npm/v/@forward-software/react-auth)](https://npmjs.com/package/@forward-software/react-auth) | Core library — provides `AuthClient`, `AuthProvider`, `createAuth`, and `useAuthClient` for integrating authentication flows in any React or React Native app |
| [`@forward-software/react-auth-google`](./packages/google-signin) | [![npm](https://img.shields.io/npm/v/@forward-software/react-auth-google)](https://npmjs.com/package/@forward-software/react-auth-google) | Google Sign-In adapter -- ready-made `AuthClient` implementation and drop-in `GoogleSignInButton` for Web and React Native (Expo) |
| [`@forward-software/react-auth-apple`](./packages/apple-signin) | [![npm](https://img.shields.io/npm/v/@forward-software/react-auth-apple)](https://npmjs.com/package/@forward-software/react-auth-apple) | Apple Sign-In adapter -- ready-made `AuthClient` implementation and drop-in `AppleSignInButton` for Web and React Native (Expo) |

## Examples

The `examples` folder contains some examples of how you can integrate these libraries in your React app:

| Example | Description |
| --- | --- |
| [`base`](./examples/base) | Basic authentication flow using `@forward-software/react-auth` |
| [`reqres`](./examples/reqres) | Authentication using the [ReqRes](https://reqres.in) API |
| [`refresh-token`](./examples/refresh-token) | Token refresh flow with Axios interceptors |
| [`expo`](./examples/expo) | React Native (Expo) integration |

## Quick Start

Install the core library:

```sh
npm install @forward-software/react-auth
```

Define your auth client:

```ts
import { createAuth, type AuthClient } from '@forward-software/react-auth';

const authClient: AuthClient = {
  onLogin: async (credentials) => {
    // Exchange credentials for tokens
    return { token: '...' };
  },
};

export const { AuthProvider, useAuthClient } = createAuth(authClient);
```

Wrap your app:

```tsx
import { AuthProvider } from './auth';

function App() {
  return (
    <AuthProvider>
      <YourApp />
    </AuthProvider>
  );
}
```

Use the hook to interact with the auth client:

```tsx
import { useAuthClient } from './auth';

function LoginButton() {
  const authClient = useAuthClient();
  return <button onClick={() => authClient.login({ username: '...', password: '...' })}>Log in</button>;
}
```

For more details, see the [`@forward-software/react-auth` README](./lib/README.md).

> **Looking for a ready-made integration?** The [`@forward-software/react-auth-google`](./packages/google-signin) package provides a drop-in Google Sign-In adapter and the [`@forward-software/react-auth-apple`](./packages/apple-signin) package provides Apple Sign-In -- both with a pre-built `AuthClient` and sign-in button for Web and React Native. See their READMEs for setup instructions.

## Project Structure

This project is a monorepo managed with [pnpm workspaces](https://pnpm.io/workspaces):

```
react-auth/
├── lib/                        # @forward-software/react-auth (core library)
├── packages/
│   ├── google-signin/          # @forward-software/react-auth-google (Google Sign-In adapter)
│   │   ├── src/
│   │   │   ├── web/            # Web implementation (Google Identity Services)
│   │   │   └── native/         # React Native implementation (Expo module)
│   │   ├── android/            # Android native module
│   │   ├── ios/                # iOS native module
│   │   └── test/               # Unit tests
│   └── apple-signin/           # @forward-software/react-auth-apple (Apple Sign-In adapter)
│       ├── src/
│       │   ├── web/            # Web implementation (Sign in with Apple JS)
│       │   └── native/         # React Native implementation (Expo module)
│       ├── android/            # Android native module
│       ├── ios/                # iOS native module
│       └── test/               # Unit tests
└── examples/                   # Example applications
    ├── base/                   # Basic React example
    ├── reqres/                 # ReqRes API example
    ├── refresh-token/          # Token refresh example
    └── expo/                   # React Native (Expo) example
```

For a detailed breakdown of the source layout and architecture, see the [Contributing Guide](CONTRIBUTING.md#project-architecture).

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- [pnpm](https://pnpm.io/) (see `packageManager` in `package.json` for the required version)

### Installation

```sh
pnpm install
```

See the [Contributing Guide](CONTRIBUTING.md#repository-setup) for the full list of build, test, and lint commands.

## Contributing

Contributions are welcome! Here's how to get started:

1. Fork the repo and create your branch from `main`
2. Install dependencies: `pnpm install`
3. Make your changes and add/update tests
4. Ensure everything works: `pnpm -r lint && pnpm -r test && pnpm -r build`
5. Commit using [Conventional Commits](https://www.conventionalcommits.org/) (e.g., `feat: ...`, `fix: ...`)
6. Open a pull request

For more details, read the [Contributing Guide](CONTRIBUTING.md) and the [Code of Conduct](CODE_OF_CONDUCT.md).

Found a security issue? Please report it privately — see our [Security Policy](SECURITY.md).

## Credits

This library has been inspired by [`react-keycloak`](https://github.com/react-keycloak/react-keycloak) and similar libraries.

## License

MIT

---

Made with ✨ & ❤️ by [ForWarD Software](https://github.com/forwardsoftware) and [contributors](https://github.com/forwardsoftware/react-auth/graphs/contributors)

If you found this project to be helpful, please consider contacting us to develop your React and React Native projects.
