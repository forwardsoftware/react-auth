# Examples

This directory contains example applications that demonstrate how to use `@forward-software/react-auth`. They exist for documentation and manual testing purposes only — they are **not** published to npm and are **not** part of the pnpm workspace.

## Available examples

| Example | Path | Description |
| --- | --- | --- |
| Base | `base/` | Minimal Vite + React example |
| ReqRes | `reqres/` | Authenticates against the [ReqRes](https://reqres.in/) API |
| Refresh Token | `refresh-token/` | Token refresh with Axios interceptors |
| Expo | `expo/` | React Native (Expo) integration |
| Showcase | `showcase/` | Comprehensive example of all library features |

## Running an example

Each example manages its own dependencies. To run one, install its dependencies first and then start the dev server:

```sh
# Vite-based examples (base, reqres, refresh-token, showcase)
cd examples/<name>
pnpm install
pnpm dev

# Expo example
cd examples/expo
pnpm install          # or: npx pod-install (iOS only, after pnpm install)
npx expo start
```

> **Tip**: If you have already run `pnpm install` at the monorepo root, the examples resolve `@forward-software/react-auth` to the local lib source automatically (see below). You still need to `pnpm install` inside the example directory to install its own dependencies.

## Convention: referencing the core library

Example apps follow a **two-layer** convention for depending on `@forward-software/react-auth`:

1. **`package.json`** — lists the latest published version (e.g. `"2.1.0"`). This makes the example usable as a standalone project after cloning.

2. **Build-tool / TypeScript alias** — when developing inside the monorepo, the bundler resolves the import to the local lib source (`../../lib/src/index.ts`). This means any change you make to `lib/` is reflected immediately in the example without a separate build step.

### Vite-based examples

Configure the alias in two places:

**`vite.config.ts`**

```ts
import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@forward-software/react-auth': path.resolve(__dirname, '../../lib/src/index.ts'),
    },
  },
  // ...
});
```

**`tsconfig.json`** (under `compilerOptions`)

```json
{
  "paths": {
    "@forward-software/react-auth": ["./../../lib/src/index.ts"]
  }
}
```

### Expo / React Native examples

Configure the alias in `babel.config.js` using [babel-plugin-module-resolver](https://github.com/tleunen/babel-plugin-module-resolver):

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['module-resolver', { alias: { '@forward-software/react-auth': '../../lib' } }],
    ],
  };
};
```

And a matching `paths` entry in `tsconfig.json` under `compilerOptions` for IDE/tsc resolution (uses a wildcard because `expo/tsconfig.base` does not need `baseUrl`):

```json
{
  "paths": {
    "@forward-software/react-auth/*": ["../../lib/*"]
  }
}
```

## Adding a new example

1. Create the example under `examples/<name>/`.
2. Add `@forward-software/react-auth` as a dependency with the **current published version** in `package.json`.
3. Configure the bundler path alias and TypeScript `paths` mapping as shown above.
4. Mark the package as `"private": true` in `package.json`.
5. Do **not** add the example to `pnpm-workspace.yaml` — examples manage their own dependencies independently.
6. Add the example to the table in this README and to the examples list in `CONTRIBUTING.md` and `AGENTS.md`.
