# KitGlobalOptions

`KitGlobalOptions` is a static class for global WalletKit configuration that affects all instances. Currently provides time synchronization functionality, with more global settings planned for future releases.

## Time Provider

Configure how WalletKit obtains current time for transaction validation. Useful for avoiding clock skew issues and ensuring accurate `validUntil` validation.

### API

```typescript
class KitGlobalOptions {
    static setGetCurrentTime(fn: () => Promise<number> | number): void;
    static getCurrentTime(): Promise<number>;
}
```

### Usage

```typescript
import { KitGlobalOptions } from '@ton/walletkit';

// Set custom time provider (optional, before creating TonWalletKit)
KitGlobalOptions.setGetCurrentTime(async () => {
    const response = await fetch('https://your-api.com/time');
    const { timestamp } = await response.json();
    return timestamp; // Unix timestamp in seconds
});
```

**Default behavior**: Uses `Math.floor(Date.now() / 1000)` if not configured.

## Notes

- **Global scope**: Affects all `TonWalletKit` instances
- **Time format**: Unix timestamp in seconds (not milliseconds)
- **Set once**: Configure at app initialization
