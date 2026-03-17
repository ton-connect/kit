<!--
This file is auto-generated. Do not edit manually.
Changes will be overwritten when running the docs update script.
Source template: template/packages/appkit/docs/swap.md
-->

# Swap

AppKit supports swapping assets through the `SwapProvider` interface. Available providers:

- **OmnistonSwapProvider** – [STON.fi](https://ston.fi) DEX aggregator via [Omniston SDK](https://docs.ston.org/docs/developer-section/sdk/omniston-sdk)
- **DeDustSwapProvider** – [DeDust](https://dedust.io) Router v2 aggregator (no extra dependencies)

## Installation

**Omniston** requires the Omniston SDK:

```bash
npm install @ston-fi/omniston-sdk
```

**DeDust** has no additional dependencies.

## Setup

You can set up swap providers by passing them to the `AppKit` constructor.

```ts
// Initialize AppKit with swap providers
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
            apiUrl: 'https://api.ston.fi',
            defaultSlippageBps: 100, // 1%
        }),
        new DeDustSwapProvider({
            defaultSlippageBps: 100,
            referralAddress: 'EQ...', // Optional
        }),
    ],
});
```

### Register Dynamically

Alternatively, you can register providers dynamically using `registerProvider`:

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

// 2. Register swap providers
registerProvider(appKit, new OmnistonSwapProvider({ defaultSlippageBps: 100 }));
registerProvider(appKit, new DeDustSwapProvider({ defaultSlippageBps: 100 }));
```

## Configuration

- **Omniston**: [Omniston SDK documentation](https://docs.ston.org/docs/developer-section/sdk/omniston-sdk) and [provider README](https://github.com/ton-connect/kit/blob/main/packages/walletkit/src/defi/swap/omniston/README.md)
- **DeDust**: [provider README](https://github.com/ton-connect/kit/blob/main/packages/walletkit/src/defi/swap/dedust/README.md)
