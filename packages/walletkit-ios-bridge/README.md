# WalletKit iOS Bridge

JavaScript bridge for the iOS WalletKit SDK. This package provides the JavaScript layer that mediates between the native iOS WebView runtime and the cross-platform `@ton/walletkit` library.

## Architecture

This package provides the iOS-specific bridge implementation that mirrors the Android bridge architecture while remaining compatible with the iOS SDK.

## Building

Build the JavaScript bundles for iOS:

```bash
cd packages/walletkit-ios-bridge
pnpm install
pnpm build
```

This generates:
- `dist/walletkit-ios-bridge.mjs` - Main bridge bundle
- `dist/inject.mjs` - Internal browser injection
- `dist/checksums.json` - SHA-256 checksums for verification

## Integration with iOS SDK

The built bundles are copied to the iOS SDK repository for integration with the native Swift WalletKit implementation.

## Development Workflow

1. **Edit JS code** in `kit/packages/walletkit-ios-bridge/src/`
2. **Build** with `pnpm build` in this directory
3. **Copy bundles** to iOS SDK repository
4. **Rebuild iOS SDK** to pick up new bundles
5. **Test** in iOS demo app

## Polyfills

The bridge includes polyfills for WebView compatibility:
- **TextEncoder/TextDecoder**: For UTF-8 encoding
- **PBKDF2**: React Native cryptography replacement
- **expo-crypto**: Stubbed out for non-Expo environments

## See Also

- [iOS WalletKit SDK](https://github.com/tonkeeper/wallet-kit-ios)
- [Android Bridge](../walletkit-android-bridge/)
- [WalletKit Core](../walletkit/)
