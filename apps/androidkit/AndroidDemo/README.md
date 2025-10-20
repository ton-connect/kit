# Android WalletKit Demo

Demo app for TON WalletKit SDK.

## Setup

Build SDK first:

```bash
cd ../TONWalletKit-Android
./gradlew buildAndCopyWebviewToDemo
```

Then open this project in Android Studio and run.

## Features

- Wallet creation and import
- TON Connect integration
- Transaction signing
- Balance display and auto-refresh

## Structure

- `core/` - Application bootstrap and dependency wiring
- `data/` - Local storage, caches, and data sources
- `domain/` - Core models shared across layers
- `presentation/` - Compose UI, view models, UI state, and presentation models
- `libs/bridge-release.aar` - SDK (copied by build task)
