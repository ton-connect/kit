# Polyfills

The app uses several polyfills to ensure Node.js API compatibility in the React Native environment. This is required for TON SDK and cryptographic libraries to work properly.

## Quick Start

Install all required polyfills:

```bash
# npm
npm install react-native-quick-crypto @craftzdog/react-native-buffer readable-stream react-native-url-polyfill react-native-sse empty-module

# yarn
yarn add react-native-quick-crypto @craftzdog/react-native-buffer readable-stream react-native-url-polyfill react-native-sse empty-module

# pnpm
pnpm add react-native-quick-crypto @craftzdog/react-native-buffer readable-stream react-native-url-polyfill react-native-sse empty-module
```

## Setup

### 1. Create `polyfills/eventsource.js`

Create a `polyfills` folder in the project root (or any convenient location) and add the EventSource polyfill. We'll reference this folder in the next steps.

`react-native-sse` only supports `addEventListener()` API, but some libraries expect the standard browser EventSource property handlers (`onmessage`, `onopen`, etc.). This polyfill bridges the two APIs:

```javascript
// polyfills/eventsource.js
import RNEventSource from 'react-native-sse';

class EventSourcePolyfill {
    constructor(url, options = {}) {
        const es = new RNEventSource(url, options);

        // Bridge addEventListener to property handlers (onopen, onmessage, etc.)
        // react-native-sse only supports addEventListener, not property handlers
        es.addEventListener('open', (e) => es.onopen?.(e));
        es.addEventListener('message', (e) => es.onmessage?.(e));
        es.addEventListener('error', (e) => es.onerror?.(e));
        es.addEventListener('close', (e) => es.onclose?.(e));

        return es;
    }
}

globalThis.EventSource = EventSourcePolyfill;
```

### 2. Create `src/globals.ts`

Create a file that initializes all polyfills. This file must be imported **before** any other application code.

For **bare React Native** projects, import this file at the very top of your entry point (e.g., `index.js`). For **Expo** projects, see the next step:

```typescript
// src/globals.ts
import 'react-native-url-polyfill/auto';
import '../polyfills/eventsource';
import { install } from 'react-native-quick-crypto';

install();
```

### 3. Create entry point `src/index.ts` (Expo only)

For Expo projects using `expo-router`, create an entry point that imports globals first:

```typescript
// src/index.ts
import './globals';
import 'expo-router/entry';
```

Update `package.json` to point the `main` field to your entry file:

```json
{
  "main": "src/index.ts"
}
```

This ensures polyfills are loaded before Expo Router and any other application code.

See [Expo Router: Custom entry point](https://docs.expo.dev/router/installation/#custom-entry-point-to-initialize-and-load) for more details.

### 4. Configure Metro

Metro is the JavaScript bundler for React Native. Some dependencies may import Node.js built-in modules (like `crypto`, `buffer`, `stream`) that don't exist in React Native. You need to tell Metro how to resolve these modules to their polyfill packages.

> **Note:** For Expo Managed Workflow, you need to create `metro.config.js` manually as it doesn't exist by default. See [Customizing Metro](https://docs.expo.dev/guides/customizing-metro/) for more details. Also note that polyfilling is not supported with "Expo Go" app — it only works with Custom Dev Client and EAS builds.

#### extraNodeModules

`extraNodeModules` maps Node.js module names to their polyfill packages. When your code (or a dependency) imports `crypto`, `buffer`, etc., Metro will resolve them to the specified polyfills.

Some dependencies import Node.js modules that aren't actually used at runtime (e.g., `http`, `https`, `os`). Instead of installing full polyfills for these (which would increase bundle size), we use `empty-module` — a package that exports an empty object. This satisfies the import without adding unnecessary code to the bundle.

```javascript
// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
  // Required polyfills
  url: require.resolve('react-native-url-polyfill'),
  crypto: require.resolve('react-native-quick-crypto'),
  stream: require.resolve('readable-stream'),
  buffer: require.resolve('@craftzdog/react-native-buffer'),
  // Empty stubs for unused Node.js modules
  assert: require.resolve('empty-module'),
  http: require.resolve('empty-module'),
  https: require.resolve('empty-module'),
  os: require.resolve('empty-module'),
  zlib: require.resolve('empty-module'),
  path: require.resolve('empty-module'),
};

module.exports = config;
```

If you actually need functionality from these modules, replace `empty-module` with a real polyfill: `assert`, `stream-http`, `https-browserify`, `os-browserify`, `browserify-zlib`, `path-browserify`.

#### Custom Resolvers

`resolveRequest` allows fine-grained control over module resolution. **This step is required when using `react-native-quick-crypto`.**

> **Note:** If you use `expo-crypto` + `react-native-fast-pbkdf2` instead of `react-native-quick-crypto`, you can skip this step — `@ton/crypto-primitives` will use its native React Native build automatically.

The `@ton/crypto-primitives` package has two builds: one for React Native (expects `expo-crypto` and `react-native-fast-pbkdf2`) and one for Node.js. Since we use `react-native-quick-crypto` as our crypto polyfill, we need to force the Node.js build:

```javascript
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === '@ton/crypto-primitives') {
    return {
      filePath: require.resolve('@ton/crypto-primitives/dist/node.js'),
      type: 'sourceFile',
    };
  }

  return context.resolveRequest(context, moduleName, platform);
};
```

See [Metro Resolver](https://metrobundler.dev/docs/resolution/) for more details.

## Used Polyfills

### Cryptography

| Module | Polyfill | Description |
|--------|----------|-------------|
| `crypto` | [react-native-quick-crypto](https://github.com/margelo/react-native-quick-crypto) | Native implementation of Node.js crypto API using JSI for high performance |

```bash
pnpm add react-native-quick-crypto
```

### Buffer and Stream

| Module | Polyfill | Description |
|--------|----------|-------------|
| `buffer` | [@craftzdog/react-native-buffer](https://github.com/nicklockwood/react-native-buffer) | Native Buffer implementation for React Native |
| `stream` | [readable-stream](https://github.com/nodejs/readable-stream) | Node.js streams for browser/RN |

```bash
pnpm add @craftzdog/react-native-buffer readable-stream
```

### URL

| Module | Polyfill | Description |
|--------|----------|-------------|
| `url` | [react-native-url-polyfill](https://github.com/nicklockwood/react-native-url-polyfill) | Polyfill for URL and URLSearchParams |

```bash
pnpm add react-native-url-polyfill
```

### EventSource (SSE)

| Module | Polyfill | Description |
|--------|----------|-------------|
| `eventsource` | Custom (see below) | Wrapper over [react-native-sse](https://github.com/nicklockwood/react-native-sse) for Server-Sent Events |

The custom polyfill is located in `polyfills/eventsource.js` and provides:
- Browser-compatible EventSource API interface
- Automatic `Accept: text/event-stream` headers
- Logging for debugging


## Alternative Polyfills

You can use different polyfills depending on your project setup:

### Crypto alternatives

| Polyfill | Use case |
|----------|----------|
| `expo-crypto` + `react-native-fast-pbkdf2` | Expo projects only. Allows using the native RN build of `@ton/crypto-primitives` |
| `react-native-quick-crypto` | Works with or without Expo. Requires forcing Node.js build of `@ton/crypto-primitives` via Metro resolver |

### Buffer alternatives

| Polyfill | Use case |
|----------|----------|
| `@craftzdog/react-native-buffer` | Native implementation, better performance |
| `buffer` | Standard browser polyfill, works everywhere |

## Debugging

If you encounter polyfill issues:

1. Make sure `src/globals.ts` is imported first
2. Check the console for `[EventSource]` messages
3. For crypto issues, verify that `install()` was called

## References

- [Expo: Using Node.js Standard Library](https://docs.expo.dev/guides/using-node-standard-library/)
- [react-native-quick-crypto](https://github.com/margelo/react-native-quick-crypto)
- [Metro Resolver](https://metrobundler.dev/docs/resolution/)
