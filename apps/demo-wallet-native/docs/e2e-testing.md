# E2E Testing Guide

This guide explains how to run end-to-end tests for the demo-wallet-native app using [Maestro](https://maestro.mobile.dev/).

## Prerequisites

1. **Install Maestro**
   
   Follow the installation guide: https://docs.maestro.dev/getting-started/installing-maestro

2. **Build the app**
   ```bash
   pnpm ios
   # or
   pnpm android
   ```

3. **Configure environment**
   ```bash
   cp .maestro/.env.example .maestro/.env
   ```
   
   Edit `.maestro/.env` and set your values:
   - `MNEMONIC` - wallet seed phrase for import tests
   - `PASSWORD` - wallet password (default: 1111)
   - `DAPP_URL` - dApp URL for connect tests
   - `ALLURE_API_TOKEN` - Allure TestOps API token (for Allure integration)
   - `ALLURE_BASE_URL` - Allure TestOps URL (default: https://tontech.testops.cloud)
   - `ALLURE_PROJECT_ID` - Allure project ID (default: 100)

## Running Tests

### Run all tests
```bash
pnpm e2e
```

### Run specific test by name
```bash
pnpm e2e "Sign text"
```

### Run test by Allure ID
```bash
pnpm e2e 2258
```

### Run any Maestro test directly
```bash
maestro test .maestro/tests/<test-file>.yaml
```

## Test Configuration

Tests are configured in `.maestro/config.ts`. Each test has:
- `name` - test display name
- `file` - path to Maestro YAML file
- `allureId` - (optional) Allure TestOps test case ID for fetching precondition/expectedResult

## Test Files

| File | Description |
|------|-------------|
| `tests/import-wallet.yaml` | Import wallet with mnemonic |
| `tests/connect-disconnect.yaml` | Connect to dApp and disconnect |
| `tests/sign-data-test.yaml` | Sign data request (requires Allure) |

## Flows (Reusable)

| Flow | Description |
|------|-------------|
| `flows/unlock-wallet.yaml` | Unlock wallet with password |
| `flows/connect-wallet.yaml` | Connect to dApp via Tonkeeper |

## Architecture

```
.maestro/
├── config.ts          # Test configuration
├── run-tests.ts       # Test runner script
├── allure.ts          # Allure TestOps API client
├── utils.ts           # Utility functions
├── flows/             # Reusable Maestro flows
│   ├── unlock-wallet.yaml
│   └── connect-wallet.yaml
└── tests/             # Test files
    ├── import-wallet.yaml
    ├── connect-disconnect.yaml
    └── sign-data-test.yaml
```
