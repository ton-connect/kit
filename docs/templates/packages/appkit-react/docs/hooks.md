---
target: packages/appkit-react/docs/hooks.md
---

# Hooks

AppKit React provides a set of hooks to interact with the blockchain and wallets.

## Core
 
 ### `useAppKit`
 
 Hook to access the `AppKit` instance.
 
 %%docs/examples/src/appkit/hooks/core#USE_APP_KIT%%
 
 ### `useAppKitTheme`
 
 Hook to access and toggle the current theme.
 
 %%docs/examples/src/appkit/hooks/core#USE_APP_KIT_THEME%%
 
 ## Balances

### `useBalance`

Hook to get the TON balance of the currently selected wallet.

%%docs/examples/src/appkit/hooks/balances#USE_BALANCE%%

### `useBalanceByAddress`

Hook to fetch the TON balance of a specific address.

%%docs/examples/src/appkit/hooks/balances#USE_BALANCE_BY_ADDRESS%%

### `useWatchBalance`

Hook to enable real-time balance updates for the currently selected wallet. It automatically updates the TanStack Query cache.

%%docs/examples/src/appkit/hooks/balances#USE_WATCH_BALANCE%%

### `useWatchBalanceByAddress`

Hook to enable real-time balance updates for a specific address.

%%docs/examples/src/appkit/hooks/balances#USE_WATCH_BALANCE_BY_ADDRESS%%

## Jettons

### `useJettons`

Hook to get all jettons owned by the currently selected wallet.

%%docs/examples/src/appkit/hooks/jettons#USE_JETTONS%%

### `useJettonsByAddress`

Hook to get all jettons owned by a specific address.

%%docs/examples/src/appkit/hooks/jettons#USE_JETTONS_BY_ADDRESS%%

### `useJettonBalanceByAddress`

Hook to get the balance of a specific jetton for a wallet address.

%%docs/examples/src/appkit/hooks/jettons#USE_JETTON_BALANCE_BY_ADDRESS%%

### `useJettonInfo`

Hook to get information about a specific jetton by its address.

%%docs/examples/src/appkit/hooks/jettons#USE_JETTON_INFO%%

### `useJettonWalletAddress`

Hook to get the jetton wallet address for a specific jetton and owner address.

%%docs/examples/src/appkit/hooks/jettons#USE_JETTON_WALLET_ADDRESS%%

### `useTransferJetton`

Hook to transfer jettons to a recipient address.

%%docs/examples/src/appkit/hooks/jettons#USE_TRANSFER_JETTON%%

### `useWatchJettons`

Hook to enable real-time jetton updates for the currently selected wallet.

%%docs/examples/src/appkit/hooks/jettons#USE_WATCH_JETTONS%%

### `useWatchJettonsByAddress`

Hook to enable real-time jetton updates for a specific address.

%%docs/examples/src/appkit/hooks/jettons#USE_WATCH_JETTONS_BY_ADDRESS%%

## Network

### `useNetwork`

Hook to get network of the selected wallet.

%%docs/examples/src/appkit/hooks/network#USE_NETWORK%%

### `useNetworks`

Hook to get all configured networks.

%%docs/examples/src/appkit/hooks/network#USE_NETWORKS%%

### `useBlockNumber`

Hook to get the current masterchain block number.

%%docs/examples/src/appkit/hooks/network#USE_BLOCK_NUMBER%%

### `useDefaultNetwork`

Hook to get and set the default network for wallet connections. Returns a tuple `[defaultNetwork, setDefaultNetwork]`.

%%docs/examples/src/appkit/hooks/network#USE_DEFAULT_NETWORK%%

## NFT

### `useNft`

Hook to get a single NFT.

%%docs/examples/src/appkit/hooks/nft#USE_NFT%%

### `useNfts`

Hook to get NFTs of the selected wallet.

%%docs/examples/src/appkit/hooks/nft#USE_NFTS%%

### `useNftsByAddress`

Hook to get NFTs of a specific address.

%%docs/examples/src/appkit/hooks/nft#USE_NFTS_BY_ADDRESS%%

### `useTransferNft`

Hook to transfer NFT to another wallet.

%%docs/examples/src/appkit/hooks/nft#USE_TRANSFER_NFT%%

## Signing

### `useSignBinary`

Hook to sign binary data with the connected wallet.

%%docs/examples/src/appkit/hooks/signing#USE_SIGN_BINARY%%

### `useSignCell`

Hook to sign TON Cell data with the connected wallet.

%%docs/examples/src/appkit/hooks/signing#USE_SIGN_CELL%%

### `useSignText`

Hook to sign text messages with the connected wallet.

%%docs/examples/src/appkit/hooks/signing#USE_SIGN_TEXT%%

## Swap

### `useSwapQuote`

Hook to get a swap quote for a token pair.

%%docs/examples/src/appkit/hooks/swap#USE_SWAP_QUOTE%%

### `useBuildSwapTransaction`

Hook to build a transaction for a swap operation based on a quote.

%%docs/examples/src/appkit/hooks/swap#USE_BUILD_SWAP_TRANSACTION%%

### `useSwapProvider`

Hook to read and change the currently selected swap provider. Returns a tuple `[provider, setProviderId]` — mirrors `useSelectedWallet`.

%%docs/examples/src/appkit/hooks/swap#USE_SWAP_PROVIDER%%

### `useSwapProviders`

Hook to get all registered swap providers. The returned array keeps a stable reference until the provider list changes, so it is safe to use with `useSyncExternalStore`.

%%docs/examples/src/appkit/hooks/swap#USE_SWAP_PROVIDERS%%

## Crypto Onramp

### `useCryptoOnrampProvider`

Hook to get a registered crypto-onramp provider by id, or the default one when no id is given.

%%docs/examples/src/appkit/hooks/onramp#USE_CRYPTO_ONRAMP_PROVIDER%%

### `useCryptoOnrampProviders`

Hook to get all registered crypto-onramp providers.

%%docs/examples/src/appkit/hooks/onramp#USE_CRYPTO_ONRAMP_PROVIDERS%%

## Staking

### `useStakingProviders`

Hook to get all registered staking providers. The returned array keeps a stable reference until the provider list changes.

%%docs/examples/src/appkit/hooks/staking#USE_STAKING_PROVIDERS%%

### `useStakingProvider`

Hook to get a specific staking provider by id (or the default when no id is passed).

%%docs/examples/src/appkit/hooks/staking#USE_STAKING_PROVIDER%%

### `useStakingQuote`

Hook to get a quote for staking or unstaking a given amount.

%%docs/examples/src/appkit/hooks/staking#USE_STAKING_QUOTE%%

### `useStakedBalance`

Hook to get the user's currently staked balance.

%%docs/examples/src/appkit/hooks/staking#USE_STAKED_BALANCE%%

### `useStakingProviderInfo`

Hook to get live info about a staking provider (APY, limits, etc.).

%%docs/examples/src/appkit/hooks/staking#USE_STAKING_PROVIDER_INFO%%

### `useStakingProviderMetadata`

Hook to get static metadata about a staking provider (name, receive token, etc.).

%%docs/examples/src/appkit/hooks/staking#USE_STAKING_PROVIDER_METADATA%%

### `useBuildStakeTransaction`

Hook to build a stake transaction from a previously fetched quote.

%%docs/examples/src/appkit/hooks/staking#USE_BUILD_STAKE_TRANSACTION%%

## Transaction

### `useSendTransaction`

Hook to send a transaction to the blockchain.

%%docs/examples/src/appkit/hooks/transaction#USE_SEND_TRANSACTION%%

### `useTransferTon`

Hook to simplify transferring TON to another address.

%%docs/examples/src/appkit/hooks/transaction#USE_TRANSFER_TON%%

### `useWatchTransactions`

Hook to watch for new transactions for the currently selected wallet in real-time.

%%docs/examples/src/appkit/hooks/transaction#USE_WATCH_TRANSACTIONS%%

### `useWatchTransactionsByAddress`

Hook to watch for new transactions for a specific address in real-time.

%%docs/examples/src/appkit/hooks/transaction#USE_WATCH_TRANSACTIONS_BY_ADDRESS%%

## Wallets

### `useAddress`

Hook to get current wallet address.

%%docs/examples/src/appkit/hooks/wallets#USE_ADDRESS%%

### `useConnect`

Hook to connect a wallet.

%%docs/examples/src/appkit/hooks/wallets#USE_CONNECT%%

### `useConnectedWallets`

Hook to get all connected wallets.

%%docs/examples/src/appkit/hooks/wallets#USE_CONNECTED_WALLETS%%

### `useConnectorById`

Hook to get a connector by its ID.

%%docs/examples/src/appkit/hooks/wallets#USE_CONNECTOR_BY_ID%%

### `useConnectors`

Hook to get all available connectors.

%%docs/examples/src/appkit/hooks/wallets#USE_CONNECTORS%%

### `useDisconnect`

Hook to disconnect a wallet.

%%docs/examples/src/appkit/hooks/wallets#USE_DISCONNECT%%

### `useSelectedWallet`

Hook to get and set the currently selected wallet.

%%docs/examples/src/appkit/hooks/wallets#USE_SELECTED_WALLET%%


