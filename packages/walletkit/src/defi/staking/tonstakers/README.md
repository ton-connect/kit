<!--
This file is auto-generated. Do not edit manually.
Changes will be overwritten when running the docs update script.
Source template: template/packages/walletkit/src/defi/staking/tonstakers/README.md
-->

# Tonstakers staking provider

Liquid staking via [Tonstakers](https://tonstakers.com): stake TON for tsTON, unstake with configurable modes.

Public entry: **`createTonstakersProvider`** from `@ton/walletkit/staking/tonstakers`. It returns a factory `(ctx) => TonStakersStakingProvider` for `kit.staking.registerProvider(createTonstakersProvider(config))`. For advanced use, `TonStakersStakingProvider.createFromContext(ctx, config)` builds the provider from a `ProviderFactoryContext`.

## Configuration

Per-chain overrides are keyed by `chainId` (same keys as `TonWalletKit` `networks`):

```typescript
import { Network } from '@ton/walletkit';
import type { TonStakersProviderConfig } from '@ton/walletkit/staking/tonstakers';

const config: TonStakersProviderConfig = {
    [Network.mainnet().chainId]: {
        contractAddress: 'EQ...', // optional; defaults to known pool when available
        tonApiToken: '...', // optional TonAPI key for APY (`getStakingProviderInfo`)
    },
};
```

Networks without a known Tonstakers pool and without `contractAddress` are skipped. If no chain ends up configured, the factory throws.

## Stake transaction

`buildStakeTransaction` adds a **1 TON** fee reserve on top of the staked amount (`CONTRACT.STAKE_FEE_RES`), in line with the pool contract.

## Unstake modes (`UnstakeMode`)

| Value | Behavior |
|-------|----------|
| `UnstakeMode.INSTANT` | Immediate exit if the pool has liquidity (`fillOrKill`) |
| `UnstakeMode.WHEN_AVAILABLE` | Non–fill-or-kill; completes when liquidity allows |
| `UnstakeMode.ROUND_END` | Wait until round end for the projected rate (`waitTillRoundEnd`) |

`getSupportedUnstakeModes()` returns these three values. Quote and transaction building must use the same `unstakeMode` on the quote; if it is missing on an unstake quote, the provider defaults to **`UnstakeMode.INSTANT`**.

## Balances and pool info

- `getStakedBalance` returns `StakingBalance`: `stakedBalance` (tsTON), `instantUnstakeAvailable` (pool-side TON liquidity for instant unstake), `providerId`.
- `getStakingProviderInfo` returns APY (TonAPI), instant liquidity, and `providerId`. Responses are cached briefly to limit API calls.

## Resources

- [Tonstakers docs](https://docs.tonstakers.com)
- [Liquid staking contract](https://github.com/ton-blockchain/liquid-staking-contract)
