# WalletKit Android Bridge

JavaScript bridge for the Android WalletKit SDK. This package provides the JavaScript layer that mediates between the native Android WebView runtime and the cross-platform `@ton/walletkit` library.

## Architecture

This package mirrors the iOS bridge architecture (`walletkit-ios-bridge`) while remaining compatible with the Android SDK.

```
walletkit-android-bridge/
├── js/
│   └── src/
│       ├── api/              # Domain-specific bridge API modules
│       ├── core/             # Shared state, module loading, initialization
│       ├── transport/        # Native messaging and diagnostics
│       ├── utils/            # Pure utility helpers
│       ├── types/            # TypeScript definitions
│       ├── adapters/         # Android-specific adapters
│       ├── polyfills/        # WebView polyfills
│       ├── bridge.ts         # Main bridge entry point
│       ├── inject.ts         # Internal browser injection
│       └── index.ts          # Package entry point
├── package.json
└── tsconfig.json
```

## Building

Build the JavaScript bundles for Android:

```bash
cd kit/packages/walletkit-android-bridge
npm install
npm run build
```

This generates:
- `../../apps/androidkit/dist-android/walletkit-android-bridge.mjs` - Main bridge bundle
- `../../apps/androidkit/dist-android/inject.mjs` - Internal browser injection

## Integration with Android SDK

The built bundles are automatically copied to:
```
kit/apps/androidkit/dist-android/
└── TONWalletKit-Android/impl/src/main/assets/walletkit/
```

The Android SDK's Gradle build task `syncWalletKitWebViewAssets` copies these bundles to the SDK assets.

## Development Workflow

1. **Edit JS code** in `kit/packages/walletkit-android-bridge/js/src/`
2. **Build** with `npm run build` in this directory
3. **Rebuild Android SDK** to pick up new bundles
4. **Test** in AndroidDemo app

## Package Structure

- **api/**: Domain-driven API methods (wallets, transactions, NFTs, jettons, etc.)
- **core/**: Module loading, state management, initialization
- **transport/**: Native bridge communication, diagnostics
- **utils/**: Shared utilities (serialization, parsing, helpers)
- **types/**: Centralized TypeScript definitions

## Comparison with iOS Bridge

| Aspect | iOS Bridge | Android Bridge |
|--------|-----------|----------------|
| **Location** | `kit/packages/walletkit-ios-bridge` | `kit/packages/walletkit-android-bridge` |
| **Entry** | `main.ts` | `bridge.ts` |
| **Build Output** | `dist-ios/` | `apps/androidkit/dist-android/` |
| **SDK Integration** | Copied to kit-ios repo | Copied to SDK assets |
| **Architecture** | window.walletKit API | window.walletkitBridge + RPC |

## See Also

- [Android JS Bridge Refactoring Analysis](../../ANDROID_JS_BRIDGE_REFACTORING_ANALYSIS.md)
- [Android WalletKit SDK](../../apps/androidkit/TONWalletKit-Android/)
- [iOS Bridge](../walletkit-ios-bridge/)
