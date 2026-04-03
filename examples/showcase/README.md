# React Auth Showcase

A comprehensive example demonstrating **all key features** of [`@forward-software/react-auth`](../../lib/README.md).

## Features Demonstrated

| Feature | Where |
|---|---|
| `createAuth` setup | `src/auth.ts` |
| `AuthClient` implementation (full lifecycle) | `src/mock-auth-client.ts` |
| `AuthProvider` with `LoadingComponent` / `ErrorComponent` | `src/App.tsx` |
| `useAuthClient` hook | All components |
| `useSyncExternalStore` for reactive state | `Dashboard`, `AuthStatus`, `AuthenticatedView` |
| Token init / restore from `localStorage` | `MockAuthClient.onInit` |
| Login with credential validation | `LoginForm` |
| Token refresh | `AuthenticatedView` |
| Logout with storage cleanup | `AuthenticatedView` |
| Event system (`on` / `off`) | `EventLog` |
| All lifecycle hooks (`onPre*` / `onPost*`) | `MockAuthClient` |
| Error handling for failed login | `LoginForm` |
| `useAsyncCallback` with error tracking | `src/hooks/useAsyncCallback.ts` |

## Prerequisites

- [Node.js](https://nodejs.org/) ≥ 18
- [pnpm](https://pnpm.io/) ≥ 10

## Setup

From the **repository root**:

```bash
pnpm install
```

## Running

```bash
cd examples/showcase
pnpm dev
```

The app runs at [http://localhost:3003](http://localhost:3003).

## Running Tests

```bash
cd examples/showcase
pnpm test
```

## Valid Credentials

| Field | Value |
|---|---|
| Username | `user` |
| Password | `password` |

## Project Structure

```
src/
├── mock-auth-client.ts     # AuthClient implementation with full lifecycle
├── auth.ts                 # createAuth setup (exports AuthProvider, authClient, useAuthClient)
├── App.tsx                 # Root component with AuthProvider
├── main.tsx                # Entry point
├── styles.css              # Minimal styling
├── components/
│   ├── Dashboard.tsx       # Main layout with conditional rendering
│   ├── AuthStatus.tsx      # Status badges + token display
│   ├── LoginForm.tsx       # Login form with error handling
│   ├── AuthenticatedView.tsx # Refresh + logout actions
│   └── EventLog.tsx        # Real-time auth event log
└── hooks/
    └── useAsyncCallback.ts # Reusable async action hook with error tracking

test/
├── test-utils.tsx          # Test helpers and mock factory
├── mock-auth-client.spec.ts # Unit tests for MockAuthClient
└── components/
    ├── AuthStatus.spec.tsx
    ├── LoginForm.spec.tsx
    └── EventLog.spec.tsx
```

## UI Sections

### Auth Status
Displays `isInitialized` and `isAuthenticated` as badges, and the current tokens as formatted JSON. Updates reactively via `useSyncExternalStore`.

### Login Form
Username/password form with a **Login** button and a **Try Invalid Credentials** button that intentionally fails to demonstrate error handling.

### Authenticated View
Shown after login. Displays token expiry time, a **Refresh Tokens** button, and a **Logout** button, each with loading states.

### Event Log
Subscribes to all auth events (`initSuccess`, `loginStarted`, `loginFailed`, `refreshSuccess`, `logoutSuccess`, etc.) and displays them in a scrollable, timestamped list. Includes a **Clear** button.

## Links

- [Core Library README](../../lib/README.md)
- [Repository Root](../../README.md)
