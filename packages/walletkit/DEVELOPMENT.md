# Development

## Setup

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Watch mode for development
??pnpm dev
```

## Project Structure

```
src/
├── core/                     # Core business logic
│   ├── TonWalletKit.ts       # Main orchestration class
│   ├── BridgeManager.ts      # Bridge connection management
│   ├── WalletManager.ts      # Wallet CRUD operations
│   └── SessionManager.ts     # Session lifecycle tracking
├── handlers/                 # Event-specific handlers
│   ├── ConnectHandler.ts     # Connection requests
│   ├── TransactionHandler.ts # Transaction requests
│   └── SignDataHandler.ts    # Data signing requests
├── contracts/                # Smart contract wrappers
│   ├── JettonMaster.ts       # Jetton operations
│   └── NftItem.ts            # NFT operations
├── utils/                    # Utilities and helpers
├── types/                    # TypeScript type definitions
└── index.ts                  # Public exports
```

## Testing

```bash
pnpm test # Run all tests

pnpm test:coverage # Run tests with coverage

pnpm test:mutation # Run mutation tests (quality check)
```

## Code Quality

```bash
pnpm lint # Lint code

pnpm lint:fix # Fix linting issues

pnpm quality # Quality gate (coverage + checks)
```

## Building

```bash
pnpm build:clean # Clean build artifacts

pnpm build:cjs # Build CommonJS

pnpm build:esm # Build ES Modules

pnpm build # Build both (recommended)
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
5. **Document** - Update DOCUMENTATION.md for public APIs

### Pull Request Process

1. Create a feature branch
2. Write tests for your changes
3. Ensure all tests pass: `pnpm test`
4. Fix any linting issues: `pnpm lint:fix`
5. Submit PR with clear description

## Demo Wallet

The `apps/demo-wallet` directory contains a reference implementation showing how to integrate walletkit:

```bash
cd apps/demo-wallet
pnpm install
pnpm dev
```

Key files to review:
- `src/stores/slices/walletSlice.ts` - Kit initialization and event handlers
- `src/components/modals/` - UI for connect/transaction approvals
- `src/pages/SendTransaction.tsx` - Programmatic transaction creation

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

## Release Process

1. Update version in `package.json`
2. Run `pnpm build` to create fresh build
3. Run `pnpm test` to verify all tests pass
4. Run `pnpm quality` to check coverage
5. Commit changes and tag release
6. Publish to npm: `npm publish`
