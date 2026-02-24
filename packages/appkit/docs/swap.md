# Swap

AppKit supports swapping assets through the `SwapProvider` interface. The primary provider is `OmnistonSwapProvider`, which integrates with the [STON.fi](https://ston.fi) DEX aggregator via the [Omniston SDK](https://docs.ston.org/docs/developer-section/sdk/omniston-sdk).

## Installation

To use `OmnistonSwapProvider`, you need to install `@ston-fi/omniston-sdk`:

```bash
npm install @ston-fi/omniston-sdk
```

## Setup

You can set up `OmnistonSwapProvider` by passing it to the `AppKit` constructor.

```ts
// Initialize AppKit with swap provider
const appKit = new AppKit({
    networks: {
        [Network.mainnet().chainId]: {
            apiClient: {
                url: 'https://toncenter.com',
                key: 'your-key',
            },
        },
    },
    providers: [
        new OmnistonSwapProvider({
            // Optional configuration
            apiUrl: 'https://api.ston.fi',
            defaultSlippageBps: 100, // 1%
        }),
    ],
});
```

### Register Dynamically

Alternatively, you can register the provider dynamically using `registerProvider`:

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

// 2. Register swap provider
const provider = new OmnistonSwapProvider({
    // Optional configuration
    apiUrl: 'https://api.ston.fi',
});

registerProvider(appKit, provider);
```

## Configuration

For detailed configuration options and usage of `OmnistonSwapProvider`, please refer to the [Omniston SDK documentation](https://docs.ston.org/docs/developer-section/sdk/omniston-sdk) and the [provider documentation](../src/swap/omniston/README.md).
