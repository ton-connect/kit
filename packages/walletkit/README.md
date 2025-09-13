# TonWalletKit

A modular, production-ready wallet-side integration layer for TON Connect. Designed for mass adoption with clean architecture, separation of concerns, and maintainable code structure.

## 🏗️ Architecture

The kit follows a modular architecture with clear separation of concerns:

```
src/
├── core/                    # Core business logic
│   ├── TonWalletKit.ts     # Main orchestration class
│   ├── BridgeManager.ts    # Bridge connection management
│   ├── WalletManager.ts    # Wallet CRUD operations
│   ├── SessionManager.ts   # Session tracking & lifecycle
│   └── EventRouter.ts      # Event parsing & routing
├── handlers/                # Event-specific handlers
│   ├── ConnectHandler.ts   # Connection requests
│   ├── TransactionHandler.ts # Transaction requests  
│   ├── SignDataHandler.ts  # Data signing requests
│   └── DisconnectHandler.ts # Disconnect events
├── utils/                   # Pure utility functions
│   ├── storage.ts          # Storage adapters
│   ├── validation.ts       # Validation helpers
│   └── crypto.ts           # Crypto utilities
├── types/                   # Type definitions
│   ├── internal.ts         # Internal types
│   └── events.ts           # Event types
└── demo_types.ts           # Public API types
```

## 🚀 Quick Start

```typescript
import { TonWalletKit, WalletInterface } from '@ton/walletkit';

// Define your wallet implementation
const wallet: WalletInterface = {
  publicKey: 'your-public-key',
  version: 'v4r2',
  sign: async (bytes) => yourSigningFunction(bytes),
  getAddress: async () => yourAddressFunction(),
  getBalance: async () => yourBalanceFunction(),
};

// Initialize the kit
const kit = new TonWalletKit({
  bridgeUrl: 'https://bridge.tonapi.io/bridge',
  wallets: [wallet],
});

// Handle connection requests
kit.onConnectRequest(async (event) => {
  const approved = await showUserConfirmation(event);
  if (approved) {
    await kit.approveConnectRequest(event);
  } else {
    await kit.rejectConnectRequest(event);
  }
});
```

## 📦 Core Components

### TonWalletKit (Main Class)

The main orchestration class that coordinates all components:

- **Pure orchestration**: No business logic, only coordination
- **Dependency injection**: All managers injected via constructor  
- **Clean API**: Matches the original documented interface exactly

### Managers (Core Business Logic)

#### WalletManager
- Wallet CRUD operations with validation
- Persistent storage support
- Address-based wallet lookup
- Thread-safe operations

#### SessionManager  
- Session lifecycle management
- Activity tracking
- Wallet-session associations
- Automatic cleanup of inactive sessions

#### BridgeManager
- TON Connect bridge communication
- Connection management & reconnection
- Session crypto handling
- Response routing

#### EventRouter
- Event parsing & validation
- Handler coordination
- Type-safe event routing
- Error handling & recovery

### Handlers (Event Processing)

Each handler is **pure** and **self-contained**:

- **ConnectHandler**: Connection request parsing & preview generation
- **TransactionHandler**: Transaction parsing, BOC handling, emulation
- **SignDataHandler**: Data parsing, format detection, preview creation  
- **DisconnectHandler**: Disconnection event processing

### Utils (Pure Functions)

#### Storage
- **LocalStorageAdapter**: Web localStorage wrapper
- **MemoryStorageAdapter**: In-memory storage for testing
- **Pluggable interface**: Easy to add custom storage backends

#### Validation
- Wallet interface validation
- TON address format validation
- Transaction message validation
- Input sanitization for XSS prevention

## 🔧 Advanced Usage

### Custom Storage

```typescript
import { LocalStorageAdapter } from '@ton/walletkit';

const customStorage = new LocalStorageAdapter('myapp:');
const kit = new TonWalletKit({
  bridgeUrl: 'https://bridge.example.com',
  storage: customStorage,
});
```

### Wallet Validation

```typescript
import { validateWallet, logger } from '@ton/walletkit';

const validation = validateWallet(wallet);
if (!validation.isValid) {
  logger.error('Invalid wallet', { errors: validation.errors });
}
```

### Custom Event Handlers

```typescript
import { TransactionHandler } from '@ton/walletkit';

class CustomTransactionHandler extends TransactionHandler {
  async handle(event, context) {
    // Custom transaction processing
    const result = await super.handle(event, context);
    // Add custom logic
    return result;
  }
}
```

## 🧪 Testing

The modular architecture makes testing straightforward:

```typescript
import { WalletManager, MemoryStorageAdapter } from '@ton/walletkit';

// Test wallet manager in isolation
const storage = new MemoryStorageAdapter();
const walletManager = new WalletManager(storage);

await walletManager.addWallet(testWallet);
expect(walletManager.getWalletCount()).toBe(1);
```

## 🎯 Benefits of Modular Architecture

### For Development
- **Single Responsibility**: Each module has one clear purpose
- **Easy Testing**: Pure functions and isolated components
- **Maintainable**: Changes isolated to specific modules
- **Type Safety**: Full TypeScript coverage with strict types

### For Production
- **Scalable**: Easy to add new features without breaking existing code
- **Debuggable**: Clear error boundaries and logging
- **Performant**: Only load what you need
- **Reliable**: Validation and error handling at every layer

### For Mass Adoption
- **Extensible**: Plugin architecture for custom handlers
- **Configurable**: Multiple storage and bridge options
- **Backward Compatible**: Same API as original design
- **Well-Documented**: Clear interfaces and examples

## 🔒 Security

- **Input Validation**: All user inputs validated and sanitized
- **XSS Prevention**: String sanitization for UI display
- **Type Safety**: Runtime validation matches TypeScript types
- **Error Boundaries**: Graceful handling of malformed data

## 📈 Performance

- **Lazy Loading**: Managers initialized only when needed
- **Memory Efficient**: Proper cleanup and garbage collection
- **Async Operations**: Non-blocking I/O throughout
- **Caching**: Intelligent caching of frequently accessed data

## 🔄 Migration from Monolithic Version

The new modular version is a **drop-in replacement**:

```typescript
// Old (monolithic)
import { TonWalletKit } from '@ton/walletkit';

// New (modular) - same API!
import { TonWalletKit } from '@ton/walletkit';

// Everything works exactly the same
const kit = new TonWalletKit(options);
```

## 🤝 Contributing

The modular architecture makes contributing easier:

1. **Find the right module** for your change
2. **Write tests** for the specific component  
3. **Follow the pure function pattern** where possible
4. **Update only the relevant interfaces**

## Testing

The testing environment uses `vitest` for faster test execution and includes mutation testing to verify test effectiveness, expected coverage and quality parameters are stored in a [quality.config.ts](quality.config.ts), `jest` is also used for better IDE compatibility.

```bash
pnpm kit check   # fix lint and test
pnpm kit quality # lint, test with coverage & mutation
```

## 📄 License

ISC License - see LICENSE file for details.


