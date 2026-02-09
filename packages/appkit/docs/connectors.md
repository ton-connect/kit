# Connectors

AppKit supports wallet connections through connectors. The primary connector is `TonConnect`.

## TonConnect

To use TonConnect, you need to install `@tonconnect/ui` or `@tonconnect/ui-react` (if using React) and `@ton/appkit`.

### Installation

```bash
npm install @ton/appkit @tonconnect/ui
```

### Setup

You can set up `TonConnectConnector` by passing a `TonConnectUI` instance.

```typescript
import { AppKit } from '@ton/appkit';
import { TonConnectConnector } from '@ton/appkit/tonconnect';
import { TonConnectUI } from '@tonconnect/ui';

// 1. Initialize AppKit
const appKit = new AppKit({
    networks: {
        '-239': {}, // Mainnet
    },
});

// 2. Create TonConnectUI instance
const tonConnect = new TonConnectUI({
    manifestUrl: 'https://my-app.com/tonconnect-manifest.json',
});

// 3. Add TonConnect connector to AppKit
appKit.addConnector(new TonConnectConnector({ tonConnect }));
```

### Usage with React

If you are using `@ton/appkit-ui-react`, the connector setup is handled internally by the `AppKitProvider` or similar setup, but for standalone usage or custom integrations, the above approach is standard.

### Configuration

`TonConnectConnector` takes a configuration object:

```typescript
interface TonConnectConnectorConfig {
    tonConnect: TonConnectUI;
    id?: string; // Optional custom ID
    metadata?: ConnectorMetadata; // Optional metadata
}
```
