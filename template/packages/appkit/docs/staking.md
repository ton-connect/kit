---
target: packages/appkit/docs/staking.md
---

# Staking

AppKit supports staking through various providers. Available providers:

- **createTonstakersProvider** – [Tonstakers](https://tonstakers.com) liquid staking (`TonStakersStakingProvider` instance type)

## Installation

Staking providers are included in the `@ton/appkit` package. No extra dependencies are required.

## Setup

You can set up staking providers by passing them to the `AppKit` constructor.

%%demo/examples/src/appkit/staking#STAKING_PROVIDER_INIT%%

### Register Dynamically

Alternatively, you can register providers dynamically using `registerProvider`:

%%demo/examples/src/appkit/staking#STAKING_PROVIDER_REGISTER%%

## Configuration

- **Tonstakers**: [Tonstakers documentation](https://docs.tonstakers.com) and [provider README](https://github.com/ton-connect/kit/blob/main/packages/walletkit/src/defi/staking/tonstakers/README.md)
