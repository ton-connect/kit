<!--
This file is auto-generated. Do not edit manually.
Changes will be overwritten when running the docs update script.
Source template: template/packages/walletkit/src/defi/staking/README.md
-->

# Staking

`StakingManager` (exposed as `kit.staking` on `TonWalletKit`) delegates quotes, transaction building, balances, and pool info to registered staking providers.

## Quick start

```typescript
import { TonWalletKit, Network } from '@ton/walletkit';
import { createTonstakersProvider } from '@ton/walletkit/staking/tonstakers';

const kit = new TonWalletKit({
    networks: {
        [Network.mainnet().chainId]: {
            apiClient: { url: 'https://toncenter.com', key: 'optional-api-key' },
        },
    },
});

kit.staking.registerProvider(createTonstakersProvider());
kit.staking.setDefaultProvider('tonstakers');
```

## Quote parameters

`getQuote` uses `StakingQuoteParams`:

```typescript
interface StakingQuoteParams<TProviderOptions = unknown> {
    direction: 'stake' | 'unstake';
    amount: TokenAmount;
    userAddress?: UserFriendlyAddress;
    network?: Network;
    unstakeMode?: UnstakeModes; // unstake only; see UnstakeMode in @ton/walletkit
    providerOptions?: TProviderOptions;
}
```

For Tonstakers, unstake pricing uses the spot rate when `unstakeMode` is `UnstakeMode.INSTANT`, otherwise the projected rate. If `unstakeMode` is omitted on an unstake quote, the provider defaults to `UnstakeMode.INSTANT`.

## Building and sending transactions

Use `buildStakeTransaction` for both stake and unstake: the quote’s `direction` selects the operation (Tonstakers routes unstake internally).

```typescript
const quote = await kit.staking.getQuote({
    direction: 'stake',
    amount: '1000000000',
    network: Network.mainnet(),
});

const tx = await kit.staking.buildStakeTransaction({
    quote,
    userAddress: 'EQ...',
});

await kit.handleNewTransaction(wallet, tx);
```

## Registering providers

Pass a **factory** (e.g. `createTonstakersProvider()`) or a resolved provider to `registerProvider`, same pattern as swap. Set the default with `setDefaultProvider(providerId)`.

## Custom provider

Extend `StakingProvider` and implement `getQuote`, `buildStakeTransaction`, `getStakedBalance`, `getStakingProviderInfo`, and `getSupportedUnstakeModes`.

## Available providers

- **[Tonstakers](https://github.com/ton-connect/kit/blob/main/packages/walletkit/src/defi/staking/tonstakers/README.md)** – liquid staking (tsTON)

## API reference (StakingManager)

| Method | Description |
|--------|-------------|
| `getQuote(params, providerId?)` | Stake or unstake quote |
| `buildStakeTransaction(params, providerId?)` | `TransactionRequest` for stake or unstake (per quote) |
| `getStakedBalance(userAddress, network?, providerId?)` | User staking balance |
| `getStakingProviderInfo(network?, providerId?)` | APY and pool metadata |
| `getSupportedUnstakeModes(providerId?)` | Modes supported by the provider |
| `registerProvider`, `setDefaultProvider`, `getProvider`, … | Same as other DeFi managers |
