# AGENTS.md

> Instructions for AI coding agents working on the `react-auth` monorepo.

---

## Project overview

This is a monorepo for **React Auth**, a library that simplifies authentication flows in React and React Native apps. It is managed with [pnpm workspaces](https://pnpm.io/workspaces) and contains two publishable packages plus example apps.

### Packages

| Package | Path | npm name | Description |
| --- | --- | --- | --- |
| Core library | `lib/` | `@forward-software/react-auth` | Framework-agnostic auth primitives: `AuthClient` interface, `createAuth()`, `AuthProvider`, `useAuthClient` hook, `EnhancedAuthClient` wrapper with event emitter and state management |
| Google Sign-In adapter | `packages/google-signin/` | `@forward-software/react-auth-google` | Ready-made `AuthClient` implementation and `GoogleSignInButton` for Web (Google Identity Services) and React Native (Expo native module) |
| Apple Sign-In adapter | `packages/apple-signin/` | `@forward-software/react-auth-apple` | Ready-made `AuthClient` implementation and `AppleSignInButton` for Web (Sign in with Apple JS) and React Native (Expo native module) |

### Examples

Located in `examples/`. These are **not** published — they exist for documentation and manual testing only. They are **not** part of the pnpm workspace; each example manages its own dependencies.

| Example | Path | Description |
| --- | --- | --- |
| Base | `examples/base/` | Minimal Vite + React example |
| ReqRes | `examples/reqres/` | Authenticates against the ReqRes API |
| Refresh Token | `examples/refresh-token/` | Token refresh with Axios interceptors |
| Expo | `examples/expo/` | React Native (Expo) integration |
| Showcase | `examples/showcase/` | Comprehensive example of all library features |

#### Convention: referencing the core library in examples

All examples follow a **two-layer** convention for depending on `@forward-software/react-auth`:

1. **`package.json`** — lists the latest published version (e.g. `"2.1.0"`). This makes the example buildable as a standalone project.
2. **Build-tool / TypeScript alias** — when developing inside the monorepo, the bundler resolves the import to the local lib source (`../../lib/src/index.ts`), so changes to `lib/` are reflected immediately without a separate build step.

**Vite-based examples** add the alias in `vite.config.ts`:

```ts
resolve: {
  alias: {
    '@forward-software/react-auth': path.resolve(__dirname, '../../lib/src/index.ts'),
  },
},
```

And a matching `paths` entry in `tsconfig.json` under `compilerOptions`:

```json
{
  "paths": {
    "@forward-software/react-auth": ["./../../lib/src/index.ts"]
  }
}
```

**Expo / React Native examples** use `babel-plugin-module-resolver` in `babel.config.js`:

```js
plugins: [
  ['module-resolver', { alias: { '@forward-software/react-auth': '../../lib' } }],
],
```

And a matching `paths` entry in `tsconfig.json` under `compilerOptions` for IDE/tsc resolution (uses a wildcard because `expo/tsconfig.base` does not need `baseUrl`):

```json
{
  "paths": {
    "@forward-software/react-auth/*": ["../../lib/*"]
  }
}
```

When adding a new example, apply the same two-layer setup and update the tables in `CONTRIBUTING.md`, `AGENTS.md`, and `examples/README.md`.

---

## Setup commands

```sh
# Install all dependencies (use frozen lockfile for CI-like behavior)
pnpm install

# Build all packages
pnpm -r build

# Run all tests
pnpm -r test

# Lint all packages
pnpm -r lint

# Clean build outputs
pnpm -r clean
```

### Per-package commands

```sh
# Build a specific package
pnpm --filter @forward-software/react-auth build
pnpm --filter @forward-software/react-auth-google build

# Test a specific package
pnpm --filter @forward-software/react-auth test
pnpm --filter @forward-software/react-auth-google test

# Watch mode for tests (useful during development)
pnpm --filter @forward-software/react-auth test:watch
```

The `pnpm-workspace.yaml` defines workspace members as `lib` and `packages/*`. The `catalog:` protocol in `pnpm-workspace.yaml` pins shared dependency versions (React, TypeScript, Vite, Vitest, etc.) across all packages.

---

## Architecture

### Core library (`lib/`)

The core library exposes two things from `lib/src/index.ts`:
- `createAuth` function
- `AuthClient` type

#### Key source files

- **`lib/src/auth.tsx`** — Contains all core logic:
  - `AuthClient<T, C>` interface — the contract adapters must implement. Only `onLogin()` is required; all other lifecycle hooks (`onInit`, `onPostInit`, `onPreLogin`, `onPostLogin`, `onPreRefresh`, `onRefresh`, `onPostRefresh`, `onPreLogout`, `onLogout`, `onPostLogout`) are optional.
  - `AuthClientEnhancements` class — wraps an `AuthClient` with state management (`isInitialized`, `isAuthenticated`, `tokens`), event emission (`on`/`off`/`emit` for init/login/refresh/logout events), `useSyncExternalStore` integration (`subscribe`/`getSnapshot`), and a refresh queue that deduplicates concurrent refresh calls.
  - `wrapAuthClient()` — uses `Object.setPrototypeOf` to merge the enhancement class with the original `AuthClient` instance, producing an `EnhancedAuthClient`.
  - `createAuth()` — creates a React context, wraps the provided `AuthClient`, and returns `{ AuthProvider, authClient, useAuthClient }`.
  - `AuthProvider` — React component that calls `authClient.init()` on mount, shows optional `LoadingComponent`/`ErrorComponent`, and provides the auth context to children.
  - `useAuthClient` — hook that reads from the auth context (throws if used outside `AuthProvider`).

- **`lib/src/utils.ts`** — Contains:
  - `Deferred<T>` — Promise wrapper used for the refresh queue.
  - `createEventEmitter()` — simple typed event emitter (on/off/emit).

#### Important patterns

- The library targets **ES6** and uses **`react-jsx`** JSX transform.
- `use-sync-external-store/shim` is the only runtime dependency (peer dependency is `react >= 16.8`).
- TypeScript strict mode is enabled.
- The `EnhancedAuthClient` type is `AC & AuthClientEnhancements<AC, E>` — it preserves the original client's type while adding enhanced properties/methods.

### Google Sign-In adapter (`packages/google-signin/`)

This package provides a `GoogleAuthClient` class (implements `AuthClient`) and a `GoogleSignInButton` component, with platform-specific implementations resolved at build/bundle time.

#### Entry points

- `src/index.ts` — Web entry: re-exports from `src/web/`
- `src/index.native.ts` — React Native entry: re-exports from `src/native/`
- Both export: `GoogleAuthClient`, `GoogleSignInButton`, and all types from `src/types.ts`

#### Key source files

- **`src/types.ts`** — Shared types: `GoogleAuthTokens`, `GoogleAuthCredentials`, `TokenStorage` interface, `GoogleAuthConfig`, `GoogleWebAuthConfig`, `GoogleNativeAuthConfig`.
- **`src/web/GoogleAuthClient.ts`** — Web implementation using Google Identity Services (GSI). Uses `localStorage` by default for token persistence. Parses JWT `exp` claim to track expiration.
- **`src/native/GoogleAuthClient.ts`** — React Native implementation using Expo native modules. Requires external `storage` (e.g., MMKV). Supports silent sign-in for token refresh.
- **`src/web/GoogleSignInButton.tsx`** — Renders Google's official GSI button on web.
- **`src/native/GoogleSignInButton.tsx`** — Native sign-in button component.
- **`src/native/GoogleSignInModule.ts`** — Expo module bridge (calls into native Swift/Kotlin code).
- **`src/web/gsi.ts`** — Low-level GSI script loading and initialization utilities, exposed as a separate export (`@forward-software/react-auth-google/web/gsi`).

#### Platform resolution

The `package.json` uses the `"react-native"` field and conditional `"exports"` to let bundlers resolve the correct entry point:
```json
{
  "main": "dist/index.js",
  "react-native": "dist/index.native.js",
  "exports": {
    ".": {
      "react-native": "./dist/index.native.js",
      "default": "./dist/index.js"
    }
  }
}
```

#### Native modules

- **iOS**: `ios/GoogleSignInModule.swift` — Swift implementation using Apple's Authentication Services.
- **Android**: `android/src/main/java/expo/modules/googlesignin/GoogleSignInModule.kt` — Kotlin implementation using Android Credential Manager.
- Configured via `expo-module.config.json` for Expo autolinking.

---

## Testing

### Framework

All packages use **Vitest** with **jsdom** environment, **@testing-library/react**, and **@testing-library/jest-dom**.

Vitest config (identical in both packages):
```ts
{
  environment: "jsdom",
  globals: true,
  include: ["**/*.{test,spec}.{js,jsx,ts,tsx}"],
}
```

### Test conventions

- Test files live in a `test/` directory alongside `src/`.
- File naming: `*.spec.ts` or `*.spec.tsx`.
- Tests use the **Arrange / Act / Assert** pattern (with explicit comments).
- Mock auth clients are defined in `test/test-utils.tsx` (core lib) and `test/test-utils.ts` (google-signin).
- Use `vi.spyOn()` for mocking, `vi.fn()` for stubs.
- React components are tested with `@testing-library/react` (`render`, `act`, `cleanup`).
- Always call `rtl.cleanup` in `afterEach`.

### Core lib test structure

- `test/authClient.spec.ts` — Unit tests for `EnhancedAuthClient` (init, login, refresh, logout lifecycle events and hooks).
- `test/context.spec.ts` — Tests for the React context (`useAuthClient` hook behavior).
- `test/provider.spec.tsx` — Tests for `AuthProvider` (initialization, loading/error components, auth state propagation).
- `test/test-utils.tsx` — `MockAuthClient` class, `createMockAuthClient()`, `createMockAuthClientWithHooks()`, `createChild()` helper, `flushPromises()`.

### Google Sign-In test structure

- `test/GoogleAuthClient.web.spec.ts` — Web adapter tests (token persistence, login, logout, expiration handling).
- `test/GoogleAuthClient.native.spec.ts` — Native adapter tests.
- `test/test-utils.ts` — `MockTokenStorage` class, `createMockIdToken()`, `createExpiredMockIdToken()`.

### Running tests

```sh
# Run all tests
pnpm -r test

# Run tests for a specific package
pnpm --filter @forward-software/react-auth test
pnpm --filter @forward-software/react-auth-google test

# Run a specific test file
cd lib && pnpm vitest run test/authClient.spec.ts
cd packages/google-signin && pnpm vitest run test/GoogleAuthClient.web.spec.ts

# Run a specific test by name
cd lib && pnpm vitest run -t "should notify success"
```

---

## Code style

- **TypeScript** strict mode in all packages.
- **Target**: ES6.
- **JSX transform**: `react-jsx` (no `import React` needed in JSX files, but the core lib does import React explicitly).
- **Module resolution**: `node`.
- Linting via **ESLint**: `pnpm --filter <package> lint`.
- No Prettier config at root — follow existing formatting conventions in each file.
- Use single quotes for strings (following existing code style).
- Export types with `export type` when exporting only type information.

### Import ordering

Follow this order (separated by blank lines where shown in existing code):

1. **External dependencies** — React, third-party libraries (e.g., `react`, `expo-modules-core`, `use-sync-external-store`)
2. **Type-only imports from external deps** — using `import type { ... }` (e.g., `import type { PropsWithChildren } from 'react'`)
3. **Internal value imports** — from `../types`, `./utils`, `./gsi`, etc.
4. **Internal type-only imports** — using `import type { ... }` from local files

```ts
// ✅ Correct
import React, { useEffect, useRef, useCallback } from 'react';
import type { GoogleAuthCredentials, GoogleWebAuthConfig } from '../types';
import { loadGsiScript, initializeGsi, renderGsiButton } from './gsi';
import type { GsiButtonConfig } from './gsi';
```

Always use `import type` for imports that are only used as types — never import a type with a regular `import` if it's not used as a value.

### Type definitions

- Use `type` for object shapes, unions, and intersections: `export type MyTokens = { ... }`
- Use `interface` only for contracts that classes implement: `export interface TokenStorage { ... }`
- Prefer `type` over `interface` when not implementing with a class
- Export types directly from the file where they are defined — re-export from `index.ts` using `export * from './types'`
- Place shared types in a dedicated `types.ts` file per package

### Class conventions

- `AuthClient` implementations should be classes (not plain objects) for adapter packages
- Private fields use the `private` keyword (not `#` private fields)
- Constructor should apply defaults using spread: `this.config = { scopes: DEFAULT_SCOPES, ...config }`
- Config, storage, and storageKey are `private` readonly fields set in the constructor

### Error handling

- Use bare `catch {}` (without binding the error) when the error is intentionally ignored (e.g., best-effort cleanup like GSI revoke)
- Use `catch (err)` when the error needs to be forwarded (e.g., to `onError` callbacks)
- Throw `new Error('descriptive message')` — never throw raw strings or objects
- Error messages should describe what went wrong and what the caller should do, without including sensitive data

### Naming conventions

- **Files**: PascalCase for classes/components (`GoogleAuthClient.ts`, `GoogleSignInButton.tsx`), camelCase for utilities (`gsi.ts`, `utils.ts`), kebab-case for test utils (`test-utils.ts`)
- **Types**: PascalCase with descriptive suffixes — `GoogleAuthTokens`, `GoogleAuthCredentials`, `GoogleWebAuthConfig`, `TokenStorage`
- **Constants**: UPPER_SNAKE_CASE — `DEFAULT_SCOPES`, `DEFAULT_STORAGE_KEY`
- **Test files**: `{Subject}.spec.ts` or `{Subject}.{platform}.spec.ts` (e.g., `GoogleAuthClient.web.spec.ts`)
- **Platform-specific files**: `index.ts` (web default), `index.native.ts` (React Native)

---

## Writing tests

### Test file template

```ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import * as rtl from '@testing-library/react';
import '@testing-library/jest-dom';

// Import from src
import { createAuth } from '../src';

// Import test utilities
import { createMockAuthClient } from './test-utils';

afterEach(rtl.cleanup);

describe('FeatureName', () => {
  describe('scenario', () => {
    it('should do something specific', async () => {
      // Arrange
      const mock = createMockAuthClient();
      vi.spyOn(mock, 'onInit').mockResolvedValue(null);

      // Act
      await rtl.act(async () => {
        // ... trigger the action
      });

      // Assert
      expect(mock.onInit).toHaveBeenCalledTimes(1);
    });
  });
});
```

### Test rules

- **Always** use explicit `// Arrange`, `// Act`, `// Assert` comments
- **Always** call `afterEach(rtl.cleanup)` at the top level of the test file
- **Always** wrap async React operations in `rtl.act(async () => { ... })`
- **Never** test implementation details — test behavior (events emitted, state changes, rendered output)
- **Never** import from `dist/` — always import from `../src` or `../src/auth`
- **Mock only what you own** — mock `AuthClient` methods, not React internals or library code
- Use `vi.spyOn(object, 'method')` to spy on existing methods; use `vi.fn()` for standalone stubs
- Use `mockResolvedValue` / `mockResolvedValueOnce` for async mocks, `mockReturnValue` for sync
- Test both success and failure paths for each lifecycle method (init, login, refresh, logout)
- Test that lifecycle hooks (onPreLogin, onPostLogin, etc.) are called in the correct order
- Test event emissions (e.g., `loginStarted`, `loginSuccess`, `loginFailed`) via `.on()` subscriptions

### Writing adapter tests

For adapter package tests, follow these additional patterns:

- Create a `MockTokenStorage` class implementing `TokenStorage` with a `Map`-based in-memory store and a `clear()` method for test cleanup
- Create helper functions to generate mock tokens (e.g., `createMockIdToken(claims)`, `createExpiredMockIdToken()`)
- Test token persistence: verify tokens are stored after login and cleared after logout
- Test token restoration: verify `onInit()` restores valid tokens and rejects expired ones
- Test with and without `persistTokens` option
- Separate web and native tests into different files: `*.web.spec.ts` and `*.native.spec.ts`

---

## How to contribute a fix to the core lib

1. Read and understand the relevant source in `lib/src/auth.tsx` and `lib/src/utils.ts`.
2. Write or update tests in `lib/test/` following existing patterns (Arrange/Act/Assert, use `createMockAuthClient`).
3. Run `pnpm --filter @forward-software/react-auth test` and ensure all tests pass.
4. Run `pnpm --filter @forward-software/react-auth build` to verify the build succeeds.
5. Run `pnpm --filter @forward-software/react-auth lint` to check for lint errors.

## How to implement or enhance an adapter package

Adapter packages live under `packages/` and must:

1. **Implement the `AuthClient` interface** from `@forward-software/react-auth`. At minimum, implement `onLogin()`. Optionally implement `onInit`, `onLogout`, `onRefresh`, and lifecycle hooks.
2. **Support platform-specific entry points** if targeting both web and React Native:
   - `src/index.ts` — web entry, re-exports from `src/web/`
   - `src/index.native.ts` — React Native entry, re-exports from `src/native/`
   - Configure `"main"`, `"react-native"`, and `"exports"` in `package.json`
3. **Define shared types** in a `src/types.ts` file (tokens, credentials, config, storage interface).
4. **Provide a UI component** (e.g., `SignInButton`) for both platforms if applicable.
5. **Add `@forward-software/react-auth`** as both a `devDependency` and a `peerDependency`.
6. **Write tests** in a `test/` directory with platform-specific spec files (e.g., `*.web.spec.ts`, `*.native.spec.ts`). Create mock utilities in `test/test-utils.ts`.
7. **Use the same build tooling**: TypeScript compilation with `tsc`, Vitest for testing, same `tsconfig.json` structure.
8. **Register the package in CI/CD and release configuration** (critical — the package will not be tested or published otherwise):
   - `pnpm-workspace.yaml` — already covered by the `packages/*` glob, no action needed unless the package is outside `packages/`.
   - `.github/workflows/build-test.yml` — add the new package's npm name to **both** the `test` and `build` job `matrix.package` arrays so it is tested and built in CI.
   - `release-please-config.json` — add an entry under `"packages"` with the package path (e.g., `"packages/my-adapter": {}`) to enable automated versioning, changelog generation, and npm publishing via the release workflow.
   - `.github/dependabot.yml` — add the package path to the `directories` list under the `npm` package ecosystem so its dependencies are monitored for updates.
   - `.github/ISSUE_TEMPLATE/bug_report.yml` — add the new package name to the "Which package is affected?" dropdown options.
   - `.github/ISSUE_TEMPLATE/feature_request.yml` — add the new package name to the "Which package is this for?" dropdown options.
   - `.github/CODEOWNERS` — add a rule for the new package path with the appropriate owner(s).
9. **Update documentation**:
   - `README.md` — add the new package to the **Packages** table (with npm badge and description).
   - `SECURITY.md` — add the new package and its supported version to the **Supported Versions** table.
   - `CONTRIBUTING.md` — update any section that lists existing packages (e.g., architecture overview, examples).
   - `AGENTS.md` — update the Project overview packages table and any architecture sections that reference existing packages.
   - Create a `README.md` in the package directory with install instructions, quick start, API reference, and consistent badges/footer (follow the structure of `packages/google-signin/README.md`).

### Adapter package script conventions

```json
{
  "scripts": {
    "build:code": "tsc --removeComments",
    "build:types": "tsc --declaration --emitDeclarationOnly",
    "build": "npm-run-all clean build:*",
    "lint": "eslint src",
    "test": "vitest",
    "test:watch": "vitest watch",
    "clean": "rimraf dist"
  }
}
```

---

## CI/CD

> **Important**: When adding a new package, you **must** update the GitHub Actions workflows and release configuration. Without this, the package will not be tested, built, or published. See the checklist in "How to implement or enhance an adapter package" step 8 above.

### Build & Test (`.github/workflows/build-test.yml`)

- Runs on pushes to all branches except `main`.
- Tests each package against Node.js matrix: `lts/-1`, `lts/*`, `latest`.
- Builds each package separately.
- Uses `pnpm i --frozen-lockfile` then `pnpm install --no-frozen-lockfile --config.auto-install-peers=true` for peer dependencies.

### Release (`.github/workflows/release.yml`)

- Runs on pushes to `main` and weekly on Tuesday evenings.
- Uses [Release Please](https://github.com/googleapis/release-please-action) to automate versioning and changelogs.
- Builds and publishes to npm with provenance (`id-token: write`).
- Configuration in `release-please-config.json`.

---

## PR guidelines

- Run `pnpm --filter <package> lint` and `pnpm --filter <package> test` before committing.
- Ensure `pnpm --filter <package> build` succeeds.
- Add or update tests for any code changes.
- Follow [Conventional Commits](https://www.conventionalcommits.org/) for commit messages (used by Release Please for changelog generation).
- See [CONTRIBUTING.md](CONTRIBUTING.md) for full contribution guidelines.

### Commit message format

Release Please uses commit messages to determine version bumps and generate changelogs. Use these prefixes:

```
feat: add token expiration event                    # → minor version bump (0.x.0)
fix: prevent duplicate refresh calls                # → patch version bump (0.0.x)
fix!: change onRefresh signature                    # → major version bump (x.0.0) — breaking change
chore: update dev dependencies                      # → no release
docs: update README examples                        # → no release
test: add missing logout tests                      # → no release
refactor: extract token validation logic            # → no release
```

For scoped changes, include the package scope:

```
feat(google-signin): add One Tap support
fix(react-auth): handle concurrent refresh race condition
```

### Checklist before submitting

1. ✅ Code compiles: `pnpm --filter <package> build`
2. ✅ Linting passes: `pnpm --filter <package> lint`
3. ✅ All tests pass: `pnpm --filter <package> test`
4. ✅ New tests added for new/changed code
5. ✅ No `console.log` or debug statements left in source code
6. ✅ No tokens, credentials, or secrets in error messages
7. ✅ Commit message follows Conventional Commits format
8. ✅ If adding a new package: CI workflows and release config updated

---

## Common pitfalls

Avoid these mistakes that agents frequently make:

- **Do not modify `package.json` version fields** — versions are managed automatically by Release Please. Never manually bump `"version"`.
- **Do not add `node_modules` or `dist` to commits** — these are in `.gitignore`.
- **Do not break the `AuthClient` interface** — adding optional methods is fine; changing the signature of `onLogin` or removing methods is a breaking change requiring a `feat!:` or `fix!:` commit.
- **Do not add React as a dependency** — it must remain a `peerDependency`. The same applies to `expo-modules-core` and `react-native` in adapter packages.
- **Do not use `any` in TypeScript** — use proper types or generics. The codebase uses strict mode.
- **Do not introduce new runtime dependencies** unless absolutely necessary — the core lib has only one dependency (`use-sync-external-store`). Prefer zero-dependency implementations.
- **Do not mix platform code** — web code goes in `src/web/`, native code goes in `src/native/`. Shared types go in `src/types.ts`. Never import from `react-native` in web files or from browser APIs in native files.
- **Do not skip the build step** — `pnpm build` must succeed because the published package uses `dist/`, not `src/`.
- **Do not use relative imports crossing package boundaries** — always use the npm package name (e.g., `import { createAuth } from '@forward-software/react-auth'`, not `import { createAuth } from '../../lib/src'`).

---

## Security considerations

This project handles authentication tokens and credentials. Follow these rules when making changes:

- **Never log or expose tokens** — do not add `console.log`, debug logging, or error messages that include token values, credentials, or secrets.
- **JWT parsing is read-only** — the `base64UrlDecode` / `exp` extraction in `GoogleAuthClient` is used only to check expiration. Never modify JWT contents or attempt to forge tokens.
- **Token storage** — tokens may be persisted via the `TokenStorage` interface (localStorage on web, MMKV or AsyncStorage on React Native). Never store tokens in cookies, URL parameters, or global variables.
- **Validate at boundaries** — when processing external input (credentials from sign-in flows, tokens from storage), validate the shape before using it (e.g., check `idToken` exists before accessing it).
- **No credential leakage in errors** — error messages thrown by adapters must not include user credentials or token values. Use generic messages like `"credentials with idToken are required"`.
- **HTTPS only** — any examples or documentation referencing API endpoints should use `https://` URLs.
- **Nonce support** — the Google adapter supports a `nonce` parameter to bind ID tokens to a session and prevent replay attacks. Preserve this feature when modifying the sign-in flow.
- **Peer dependency ranges** — when updating dependency versions, check for known security vulnerabilities. Do not pin to versions with known CVEs.
