# Contributing to React Auth <!-- omit in toc -->

We love your input! We want to make contributing to this project as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Adding a new adapter package

Read our [Code of Conduct](./CODE_OF_CONDUCT.md) to keep our community approachable and respectable.

In this guide you will get an overview of the contribution workflow from opening an issue, creating a PR, reviewing, and merging the PR.

> Use the table of contents icon on the top left corner of this document to get to a specific section of this guide quickly.

## New contributor guide

To get an overview of the project, read the [README](README.md).

Here are some resources to help you get started with open source contributions:

- [Finding ways to contribute to open source on GitHub](https://docs.github.com/en/get-started/exploring-projects-on-github/finding-ways-to-contribute-to-open-source-on-github)
- [Set up Git](https://docs.github.com/en/get-started/quickstart/set-up-git)
- [GitHub flow](https://docs.github.com/en/get-started/quickstart/github-flow)
- [Collaborating with pull requests](https://docs.github.com/en/github/collaborating-with-pull-requests)

## Repository setup

This project is managed with [pnpm workspaces](https://pnpm.io/workspaces). Make sure you have [pnpm](https://pnpm.io/installation) installed before getting started.

```sh
# Install all dependencies
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

# Watch mode for tests during development
pnpm --filter @forward-software/react-auth test:watch
```

## Project architecture

This is a monorepo containing two publishable packages and example applications.

### Packages

| Package | Path | npm name | Description |
| --- | --- | --- | --- |
| Core library | `lib/` | `@forward-software/react-auth` | Framework-agnostic auth primitives: `AuthClient` interface, `createAuth()`, `AuthProvider`, `useAuthClient` hook |
| Google Sign-In adapter | `packages/google-signin/` | `@forward-software/react-auth-google` | Ready-made `AuthClient` implementation and `GoogleSignInButton` for Web and React Native |

### Examples

Located in `examples/`. These are **not** published — they exist for documentation and manual testing only.

- `examples/base/` — minimal Vite + React example
- `examples/reqres/` — authenticates against the ReqRes API
- `examples/refresh-token/` — demonstrates token refresh with Axios interceptors
- `examples/expo/` — React Native (Expo) integration

### Core library (`lib/`)

The core library exposes two things from `lib/src/index.ts`:
- `createAuth` function
- `AuthClient` type

Key source files:

- **`lib/src/auth.tsx`** — Contains all core logic:
  - `AuthClient<T, C>` interface — the contract adapters must implement. Only `onLogin()` is required; all other lifecycle hooks (`onInit`, `onPostInit`, `onPreLogin`, `onPostLogin`, `onPreRefresh`, `onRefresh`, `onPostRefresh`, `onPreLogout`, `onLogout`, `onPostLogout`) are optional.
  - `AuthClientEnhancements` class — wraps an `AuthClient` with state management, event emission, and a refresh queue.
  - `createAuth()` — creates a React context, wraps the provided `AuthClient`, and returns `{ AuthProvider, authClient, useAuthClient }`.
  - `AuthProvider` — React component that calls `authClient.init()` on mount and provides the auth context.
  - `useAuthClient` — hook that reads from the auth context (throws if used outside `AuthProvider`).

- **`lib/src/utils.ts`** — Contains utility types: `Deferred<T>` and `createEventEmitter()`.

### Google Sign-In adapter (`packages/google-signin/`)

This package provides a `GoogleAuthClient` class and a `GoogleSignInButton` component, with platform-specific implementations resolved at build time.

- `src/index.ts` — Web entry
- `src/index.native.ts` — React Native entry
- `src/types.ts` — Shared types
- `src/web/` — Web-specific implementation (Google Identity Services)
- `src/native/` — React Native implementation (Expo native modules)

## Getting started with changes

We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

### Report bugs using GitHub's [issues](https://github.com/forwardsoftware/react-auth/issues)

Report a bug by [opening a new issue](https://github.com/forwardsoftware/react-auth/issues/new/choose)

#### Write bug reports with detail, background, and sample code

**Great Bug Reports** should contain:

- A quick summary and/or background
- Steps to reproduce
  - Be specific!
  - Give sample code if you can; the sample code should allow _anyone_ with a base setup to reproduce your issue
- What you expected would happen
- What actually happens
- Notes (possibly including why you think this might be happening, or stuff you tried that didn't work)

### We use [GitHub Flow](https://guides.github.com/introduction/flow/index.html), so all code changes happen through Pull Requests

We actively welcome your pull requests:

1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints.
6. Issue your pull request!

## Contributing a fix to the core library

1. Read and understand the relevant source in `lib/src/auth.tsx` and `lib/src/utils.ts`.
2. Write or update tests in `lib/test/` following existing patterns (see [Testing](#testing) below).
3. Run `pnpm --filter @forward-software/react-auth test` and ensure all tests pass.
4. Run `pnpm --filter @forward-software/react-auth build` to verify the build succeeds.
5. Run `pnpm --filter @forward-software/react-auth lint` to check for lint errors.

## Creating or enhancing an adapter package

Adapter packages live under `packages/` and should follow these conventions:

1. **Implement the `AuthClient` interface** from `@forward-software/react-auth`. At minimum, implement `onLogin()`. Optionally implement `onInit`, `onLogout`, `onRefresh`, and lifecycle hooks.
2. **Support platform-specific entry points** if targeting both web and React Native:
   - `src/index.ts` — web entry, re-exports from `src/web/`
   - `src/index.native.ts` — React Native entry, re-exports from `src/native/`
   - Configure `"main"`, `"react-native"`, and `"exports"` in `package.json`
3. **Define shared types** in a `src/types.ts` file (tokens, credentials, config, storage interface).
4. **Provide a UI component** (e.g., `SignInButton`) for both platforms if applicable.
5. **Add `@forward-software/react-auth`** as both a `devDependency` and a `peerDependency`.
6. **Write tests** in a `test/` directory with platform-specific spec files (e.g., `*.web.spec.ts`, `*.native.spec.ts`). Create mock utilities in `test/test-utils.ts`.
7. **Use the same build tooling**: TypeScript compilation with `tsc`, Vitest for testing, same `tsconfig.json` structure. Follow the `package.json` scripts convention:
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
8. **Register the package in CI/CD and release configuration** — this is critical; without it the package will not be tested, built, or published:
   - `.github/workflows/build-test.yml` — add the new package's npm name to **both** the `test` and `build` job `matrix.package` arrays.
   - `release-please-config.json` — add an entry under `"packages"` with the package path (e.g., `"packages/my-adapter": {}`) to enable automated versioning and npm publishing.
   - `.github/dependabot.yml` — add the package path to the `directories` list under the `npm` package ecosystem.
   - `.github/ISSUE_TEMPLATE/bug_report.yml` — add the new package name to the "Which package is affected?" dropdown options.
   - `.github/ISSUE_TEMPLATE/feature_request.yml` — add the new package name to the "Which package is this for?" dropdown options.
   - `.github/CODEOWNERS` — add a rule for the new package path with the appropriate owner(s).
9. **Update documentation**:
   - `README.md` — add the new package to the **Packages** table (with npm badge and description).
   - `SECURITY.md` — add the new package and its supported version to the **Supported Versions** table.
   - Create a `README.md` in the package directory with install instructions, quick start, API reference, and consistent badges/footer (follow the structure of `packages/google-signin/README.md`).

## Testing

All packages use **Vitest** with **jsdom**, **@testing-library/react**, and **@testing-library/jest-dom**.

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

### Test conventions

- Test files live in a `test/` directory alongside `src/`.
- File naming: `*.spec.ts` or `*.spec.tsx`.
- Tests use the **Arrange / Act / Assert** pattern with explicit comments.
- Use `vi.spyOn()` for mocking existing methods; use `vi.fn()` for standalone stubs.
- React components are tested with `@testing-library/react` (`render`, `act`, `cleanup`).
- Always call `rtl.cleanup` in `afterEach`.

### Test file template

```ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import * as rtl from '@testing-library/react';
import '@testing-library/jest-dom';

import { createAuth } from '../src';
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

### Adapter package tests

For adapter package tests, follow these additional patterns:

- Create a `MockTokenStorage` class implementing `TokenStorage` with a `Map`-based in-memory store.
- Create helper functions to generate mock tokens (e.g., `createMockIdToken(claims)`, `createExpiredMockIdToken()`).
- Test token persistence: verify tokens are stored after login and cleared after logout.
- Test token restoration: verify `onInit()` restores valid tokens and rejects expired ones.
- Separate web and native tests into different files: `*.web.spec.ts` and `*.native.spec.ts`.

## Code style

This project uses [ESLint](https://eslint.org/) to maintain a unified coding style. Before committing your changes, run `pnpm -r lint` and address any warnings or errors.

- **TypeScript** strict mode is enabled in all packages.
- **Target**: ES6.
- **JSX transform**: `react-jsx`.
- Use single quotes for strings (following the existing code style).
- Export types with `export type` when exporting only type information.

### Import ordering

Follow this order (separated by blank lines):

1. **External dependencies** — React, third-party libraries
2. **Type-only imports from external deps** — using `import type { ... }`
3. **Internal value imports** — from local files
4. **Internal type-only imports** — using `import type { ... }` from local files

```ts
// ✅ Correct
import React, { useEffect, useRef, useCallback } from 'react';
import type { GoogleAuthCredentials, GoogleWebAuthConfig } from '../types';
import { loadGsiScript, initializeGsi, renderGsiButton } from './gsi';
import type { GsiButtonConfig } from './gsi';
```

Always use `import type` for imports that are only used as types.

### Type definitions

- Use `type` for object shapes, unions, and intersections: `export type MyTokens = { ... }`
- Use `interface` only for contracts that classes implement: `export interface TokenStorage { ... }`
- Place shared types in a dedicated `types.ts` file per package.

### Naming conventions

- **Files**: PascalCase for classes/components (`GoogleAuthClient.ts`), camelCase for utilities (`gsi.ts`), kebab-case for test utils (`test-utils.ts`)
- **Types**: PascalCase with descriptive suffixes — `GoogleAuthTokens`, `GoogleAuthConfig`
- **Constants**: UPPER_SNAKE_CASE — `DEFAULT_SCOPES`, `DEFAULT_STORAGE_KEY`
- **Test files**: `{Subject}.spec.ts` or `{Subject}.{platform}.spec.ts`
- **Platform-specific files**: `index.ts` (web default), `index.native.ts` (React Native)

### Error handling

- Use bare `catch {}` when the error is intentionally ignored (e.g., best-effort cleanup).
- Use `catch (err)` when the error needs to be forwarded to callbacks.
- Throw `new Error('descriptive message')` — never throw raw strings or objects.
- Error messages must not include user credentials or token values.

## CI/CD overview

### Build & Test (`.github/workflows/build-test.yml`)

- Runs on pushes to all branches except `main`.
- Tests each package against multiple Node.js versions: `lts/-1`, `lts/*`, `latest`.
- Builds each package separately.

### Release (`.github/workflows/release.yml`)

- Runs on pushes to `main`.
- Uses [Release Please](https://github.com/googleapis/release-please-action) to automate versioning and changelogs.
- Builds and publishes packages to npm.
- Configuration in `release-please-config.json`.

> **Note**: Do not manually modify `"version"` fields in `package.json` — versions are managed automatically by Release Please.

## Commit message format

This project follows [Conventional Commits](https://www.conventionalcommits.org/), which Release Please uses to determine version bumps and generate changelogs.

```
feat: add token expiration event                    # → minor version bump (0.x.0)
fix: prevent duplicate refresh calls                # → patch version bump (0.0.x)
fix!: change onRefresh signature                    # → major version bump (x.0.0) — breaking change
chore: update dev dependencies                      # → no release
docs: update README examples                        # → no release
test: add missing logout tests                      # → no release
refactor: extract token validation logic            # → no release
```

For changes scoped to a specific package:

```
feat(google-signin): add One Tap support
fix(react-auth): handle concurrent refresh race condition
```

## PR submission checklist

Before opening a pull request, please verify:

1. ✅ Code compiles: `pnpm --filter <package> build`
2. ✅ Linting passes: `pnpm --filter <package> lint`
3. ✅ All tests pass: `pnpm --filter <package> test`
4. ✅ New tests added for new/changed code
5. ✅ No `console.log` or debug statements left in source code
6. ✅ No tokens, credentials, or secrets in error messages
7. ✅ Commit message follows Conventional Commits format
8. ✅ If adding a new package: CI workflows and release config updated (see [Creating or enhancing an adapter package](#creating-or-enhancing-an-adapter-package))

## Common pitfalls

A few things to keep in mind when working on this project:

- **Do not modify `package.json` version fields** — versions are managed automatically by Release Please.
- **Do not add `node_modules` or `dist` to commits** — these are in `.gitignore`.
- **Do not break the `AuthClient` interface** — adding optional methods is fine; changing the signature of `onLogin` or removing methods is a breaking change that requires a `feat!:` or `fix!:` commit.
- **Do not add React as a dependency** — it must remain a `peerDependency`. The same applies to `expo-modules-core` and `react-native` in adapter packages.
- **Do not use `any` in TypeScript** — use proper types or generics; strict mode is enabled throughout.
- **Do not introduce new runtime dependencies** unless absolutely necessary — the core lib has only one dependency (`use-sync-external-store`).
- **Do not mix platform code** — web code goes in `src/web/`, native code goes in `src/native/`. Shared types go in `src/types.ts`.
- **Do not skip the build step** — `pnpm build` must succeed because the published package uses `dist/`, not `src/`.
- **Do not use relative imports crossing package boundaries** — always use the npm package name (e.g., `import { createAuth } from '@forward-software/react-auth'`).

## Security guidelines

This project handles authentication tokens and credentials. Please follow these rules:

- **Never log or expose tokens** — do not add `console.log`, debug logging, or error messages that include token values, credentials, or secrets.
- **JWT parsing is read-only** — the `exp` extraction in `GoogleAuthClient` is used only to check expiration. Never modify JWT contents or attempt to forge tokens.
- **Token storage** — tokens may be persisted via the `TokenStorage` interface (localStorage on web, MMKV or AsyncStorage on React Native). Never store tokens in cookies, URL parameters, or global variables.
- **Validate at boundaries** — when processing external input (credentials from sign-in flows, tokens from storage), validate the shape before using it.
- **No credential leakage in errors** — error messages thrown by adapters must not include user credentials or token values.
- **HTTPS only** — any examples or documentation referencing API endpoints should use `https://` URLs.
- **Nonce support** — the Google adapter supports a `nonce` parameter to prevent replay attacks. Preserve this feature when modifying the sign-in flow.

## License

By contributing, you agree that your contributions will be licensed under its [MIT License](LICENSE).

In short, when you submit code changes, your submissions are understood to be under the same [MIT License](http://choosealicense.com/licenses/mit/) that covers the project.
Feel free to contact the maintainers if that's a concern.
