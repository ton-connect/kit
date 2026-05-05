<!--
This file is auto-generated. Do not edit manually.
Changes will be overwritten when running the docs update script.
Source template: template/packages/appkit/docs/staking.md
-->

# Staking

AppKit supports staking through various providers. Available providers:

- **createTonstakersProvider** – [Tonstakers](https://tonstakers.com) liquid staking (`TonStakersStakingProvider` instance type)

## Installation

Staking providers are included in the `@ton/appkit` package. No extra dependencies are required.

## Setup

You can set up staking providers by passing them to the `AppKit` constructor.

```ts
// Initialize AppKit with staking providers
const network = Network.mainnet();
const toncenterApiClient = new ApiClientToncenter({ network });
const appKit = new AppKit({
    networks: {
        [network.chainId]: {
            apiClient: toncenterApiClient,
        },
    },
    providers: [createTonstakersProvider()],
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

// 2. Register staking providers
registerProvider(appKit, createTonstakersProvider());
```

## Configuration

- **Tonstakers**: [Tonstakers documentation](https://docs.tonstakers.com) and [provider README](https://github.com/ton-connect/kit/blob/main/packages/walletkit/src/defi/staking/tonstakers/README.md)
