# Polyfills

The app uses several polyfills to ensure Node.js API compatibility in the React Native environment. This is required for TON SDK and cryptographic libraries to work properly.

## Overview

Polyfills are initialized in `src/globals.ts` and must be imported **before** any other application code.

```typescript
// src/globals.ts
import 'react-native-url-polyfill/auto';
import '../polyfills';
import { install } from 'react-native-quick-crypto';

install();
```

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

## Metro Configuration

Polyfills are configured in `metro.config.js`:

```javascript
config.resolver.extraNodeModules = {
  url: require.resolve('react-native-url-polyfill'),
  crypto: require.resolve('react-native-quick-crypto'),
  stream: require.resolve('readable-stream'),
  buffer: require.resolve('@craftzdog/react-native-buffer'),
};
```

### Custom Resolvers

```javascript
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Force Node.js version of @ton/crypto-primitives
  // The native RN build expects `expo-crypto` and `react-native-fast-pbkdf2` as peer deps,
  // but expo-crypto only works within Expo projects. Using the Node.js build with
  // react-native-quick-crypto as the crypto polyfill avoids this limitation.
  if (moduleName === '@ton/crypto-primitives') {
    return {
      filePath: require.resolve('@ton/crypto-primitives/dist/node.js'),
      type: 'sourceFile',
    };
  }

  // Custom EventSource polyfill
  if (moduleName === 'eventsource' || moduleName.startsWith('eventsource/')) {
    return {
      filePath: require.resolve(__dirname, 'lib/polyfills/eventsource.js'),
      type: 'sourceFile',
    };
  }

  return context.resolveRequest(context, moduleName, platform);
};
```

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
