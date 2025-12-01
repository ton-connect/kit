# Development

## Setup

```bash
pnpm install         # Install dependencies
pnpm build           # Build all packages
pnpm kit dev         # Watch mode for development kit
pnpm demo-wallet dev # Watch mode for development demo wallet and use kit
```

## Project Structure

```
src/
├── analytics/                     # Analytics and telemetry
├── bridge/                        # Bridge communication layer
├── contracts/                     # Smart contract wrappers
│   ├── v4r2/                      # Wallet V4R2 implementation
│   └── w5/                        # Wallet V5 implementation
├── core/
│   ├── TonWalletKit.ts            # Main orchestration class
│   ├── BridgeManager.ts           # Bridge connection management
│   ├── WalletManager.ts           # Wallet CRUD operations
│   ├── SessionManager.ts          # Session lifecycle tracking
│   ├── EventRouter.ts             # Event routing
│   ├── EventProcessor.ts          # Event processing
│   ├── EventStore.ts              # Event storage
│   ├── EventEmitter.ts            # Event emission
│   ├── RequestProcessor.ts        # Request processing
│   ├── Initializer.ts             # Initialization logic
│   ├── JettonsManager.ts          # Jettons management
│   ├── ApiClientToncenter.ts      # Toncenter API client
│   ├── Logger.ts                  # Logging utilities
│   └── wallet/
│       └── extensions/            # Wallet-specific extensions
│           ├── jetton.ts          # Jetton operations
│           ├── nft.ts             # NFT operations
│           └── ton.ts             # TON operations
├── errors/                        # Error handling
├── handlers/                      # Event-specific handlers
├── storage/                       # Storage abstraction and adapters LocalStorage, In-memory, Extension
└── examples/                      # Examples
```

## Code Quality

The testing environment uses `vitest` for faster test execution and includes mutation testing to verify test effectiveness. Expected coverage and quality parameters are stored in [packages/walletkit/quality.config.js](packages/walletkit/quality.config.js). `jest` can also be used for better IDE compatibility.

```bash
pnpm lint          # lint all packages
pnpm lint:fix      # lint and auto-fix issues
pnpm quality       # tests with coverage
pnpm test:mutation # Run mutation tests (quality check)
```

## Building

```bash
pnpm build
```

## Architecture Principles

### Modular Design

Each component has a single responsibility and can be tested in isolation:

- **TonWalletKit** - Orchestration layer that coordinates managers
- **Managers** - Core business logic (wallets, sessions, bridge)
- **Handlers** - Event processing (connect, transaction, sign-data)
- **Utils** - Pure functions (validation, storage, crypto)

### Testing Strategy

- **Unit Tests** - Test individual components in isolation
- **Integration Tests** - Test component interactions
- **Mutation Tests** - Verify test suite quality with Stryker

## Contributing

### Adding Features

1. **Identify the module** - Find the right place in the architecture
2. **Write tests first** - TDD approach with unit tests
3. **Implement the feature** - Follow existing patterns
4. **Update types** - Ensure TypeScript types are up to date
5. **Document** - Update README.md and docs.ton.org for public APIs

### Pull Request Process

1. Create a feature branch
2. Write tests for your changes
3. Ensure all tests pass: `pnpm quality`
4. Fix any linting issues: `pnpm lint:fix`
5. Submit PR with clear description

## Demo Wallet

The `apps/demo-wallet` directory contains a reference implementation showing how to integrate walletkit:

```bash
pnpm demo-wallet dev
```

## Debugging

### Enable Debug Logging

Set the environment variable before running:

```bash
DEBUG=walletkit:* pnpm dev
```

### Common Issues

**Bridge Connection Fails**
- Check `bridgeUrl` is correct
- Verify network connectivity
- Inspect browser console for errors

**Transaction Preview Empty**
- Ensure wallet has TON balance for fees
- Check transaction BOC is valid
- Look for emulation errors in preview

**Wallet Not Found**
- Verify wallet address format
- Check wallet was added via `addWallet()`
- Confirm storage adapter is working

## E2E Testing

### (Optional) Run TON Connect Bridge Locally
```bash
docker compose -f docker-compose.bridge.yml up -d
# check
curl -I -f -s -o /dev/null -w "%{http_code}\n" http://localhost:9103/metrics
```

### Setup `.env`

```dotenv
DAPP_URL="https://allure-test-runner.vercel.app/e2e" # (optional) target app url
WALLET_MNEMONIC="word1 word2 ..." # mnemonic for main wallet for test
ALLURE_API_TOKEN="" # Access token for Allure for getting test data
ALLURE_PROJECT_ID="100" # Allure project ID
ALLURE_BASE_URL="https://ton-connect-test-runner.tapps.ninja/api/v1/allure-proxy"
E2E_SLOW_MO="0" # (optional) Slows down Playwright operations by the specified amount of milliseconds
CI="1" # (optional) allows headless mode
TIMEOUT="30000" # (optional) default 60000
WORKERS_COUNT="16" # (optional) default not set

## <!-- Env for testing extension start -->
E2E_WALLET_SOURCE_EXTENSION="../../dist-extension-chrome" # (optional) path to the extension
E2E_JS_BRIDGE="true" # (optional) enables js bridge test mode for the e2e tests
VITE_DISABLE_NETWORK_SEND="true" # (optional) defaults to false, disables broadcast to the blockchain
VITE_DISABLE_HTTP_BRIDGE="true" # (optional) defaults to false, allows to load walletkit without http bridge
VITE_DISABLE_AUTO_POPUP="true" # (optional) defaults to false, disables auto open for extension popup
## <!-- Env for testing extension end -->

## <!-- Env for testing webapp start -->
E2E_WALLET_SOURCE="http://localhost:5173/" # (optional) custom url for the web mode

VITE_DISABLE_NETWORK_SEND="true" # (optional) defaults to false, disables broadcast to the blockchain
VITE_DISABLE_AUTO_POPUP="true" # (optional) defaults to false, disables auto open for extension popup
VITE_BRIDGE_URL="https://connect.ton.org/bridge" # (optional) use custom url bridge in web app
## <!-- Env for testing webapp end -->
```

### Install and Build Dependencies
```bash
pnpm install
pnpm --filter demo-wallet e2e:deps
pnpm build
```

### Run Test Specs
```bash
pnpm demo-wallet e2e
# or
xvfb-run pnpm demo-wallet e2e
```

## Release Process

1. Update version in `package.json`
2. See Code Quality and E2E Testing sections
3. Commit changes and tag release
4. Publish to npm: `npm publish`
