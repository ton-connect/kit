---
target: packages/appkit/docs/swap.md
---

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

%%demo/examples/src/appkit/swap#SWAP_PROVIDER_INIT%%

### Register Dynamically

Alternatively, you can register providers dynamically using `registerProvider`:

%%demo/examples/src/appkit/swap#SWAP_PROVIDER_REGISTER%%

## Configuration

- **Omniston**: [Omniston SDK documentation](https://docs.ston.org/docs/developer-section/sdk/omniston-sdk) and [provider README](https://github.com/ton-connect/kit/blob/main/packages/walletkit/src/defi/swap/omniston/README.md)
- **DeDust**: [provider README](https://github.com/ton-connect/kit/blob/main/packages/walletkit/src/defi/swap/dedust/README.md)
