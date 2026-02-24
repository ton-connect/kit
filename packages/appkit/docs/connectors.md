# Connectors

AppKit supports wallet connections through connectors. The primary connector is `TonConnect`.

## TonConnect

To use TonConnect, you need to install `@tonconnect/ui` and `@ton/appkit`.

### Installation

```bash
npm install @ton/appkit @tonconnect/ui
```

### Import

`TonConnectConnector` is located in a separate entry point `@ton/appkit/tonconnect` to allow tree-shaking for users who don't need TonConnect functionality.

```typescript
import { TonConnectConnector } from '@ton/appkit/tonconnect';
```

### Setup

You can set up `TonConnectConnector` by passing `tonConnectOptions`. The connector will create the `TonConnectUI` instance internally.

```ts
const appKit = new AppKit({
    networks: {
        [Network.mainnet().chainId]: {
            apiClient: {
                url: 'https://toncenter.com',
                key: 'your-key',
            },
        },
    },
    connectors: [
        new TonConnectConnector({
            tonConnectOptions: {
                manifestUrl: 'https://my-app.com/tonconnect-manifest.json',
            },
        }),
    ],
});
```

Alternatively, you can pass an existing `TonConnectUI` instance:

```ts
// 1. Create TonConnectUI instance
const tonConnectUI = new TonConnectUI({
    manifestUrl: 'https://my-app.com/tonconnect-manifest.json',
});

// 2. Initialize AppKit
const appKit = new AppKit({
    networks: {
        [Network.mainnet().chainId]: {
            apiClient: {
                url: 'https://toncenter.com',
                key: 'your-key',
            },
        },
    },
    connectors: [new TonConnectConnector({ tonConnectUI })],
});
```

### Add Connector Dynamically

In some cases, you may need to add a connector after initialization. You can use the `addConnector` method for this purpose.

```ts
// 1. Initialize AppKit
const appKit = new AppKit({
    networks: {
        [Network.mainnet().chainId]: {
            apiClient: {
                url: 'https://toncenter.com',
                key: 'your-key',
            },
        },
    },
});

// 2. Initialize TonConnect connector
const connector = new TonConnectConnector({
    tonConnectOptions: {
        manifestUrl: 'https://my-app.com/tonconnect-manifest.json',
    },
});

// 3. Add connector dynamically
appKit.addConnector(connector);
```

### Configuration

`TonConnectConnector` takes a configuration object:

```typescript
interface TonConnectConnectorConfig {
    /**
     * TonConnectUI options or instance
     */
    tonConnectUI?: TonConnectUI;
    tonConnectOptions?: TonConnectUiCreateOptions;
    /**
     * Connector ID
     * @default 'tonconnect'
     */
    id?: string;
    /**
     * Connector metadata
     */
    metadata?: ConnectorMetadata;
}
```

### Connector Metadata

You can provide metadata for the connector, which can be used to display connector information in the UI.

```typescript
interface ConnectorMetadata {
    /**
     * Connector name
     */
    name: string;
    /**
     * Connector icon URL
     */
    iconUrl?: string;
}
```
