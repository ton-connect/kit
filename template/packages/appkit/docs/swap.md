---
target: packages/appkit/docs/swap.md
---

# Swap

AppKit supports swapping assets through the `SwapProvider` interface. The primary provider is `OmnistonSwapProvider`, which integrates with the [STON.fi](https://ston.fi) DEX aggregator via the [Omniston SDK](https://docs.ston.org/docs/developer-section/sdk/omniston-sdk).

## Installation

To use `OmnistonSwapProvider`, you need to install `@ston-fi/omniston-sdk`:

```bash
npm install @ston-fi/omniston-sdk
```

## Setup

You can set up `OmnistonSwapProvider` by passing it to the `AppKit` constructor.

%%demo/examples/src/appkit/swap#SWAP_PROVIDER_INIT%%

### Register Dynamically

Alternatively, you can register the provider dynamically using `registerProvider`:

%%demo/examples/src/appkit/swap#SWAP_PROVIDER_REGISTER%%

## Configuration

For detailed configuration options and usage of `OmnistonSwapProvider`, please refer to the [Omniston SDK documentation](https://docs.ston.org/docs/developer-section/sdk/omniston-sdk) and the [provider documentation](../src/swap/omniston/README.md).
