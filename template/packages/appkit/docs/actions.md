---
target: packages/appkit/docs/actions.md
---

# Actions

AppKit provides a set of actions to interact with the blockchain and wallets.

## Balances

### `getBalance`

Get the TON balance of the currently selected wallet.

%%demo/examples/src/appkit/actions/balances#GET_BALANCE%%

### `getBalanceByAddress`

Fetch the TON balance of a specific address.

%%demo/examples/src/appkit/actions/balances#GET_BALANCE_BY_ADDRESS%%

### `watchBalance`

Watch the TON balance of the currently selected wallet in real-time.

%%demo/examples/src/appkit/actions/balances#WATCH_BALANCE%%

### `watchBalanceByAddress`

Watch the TON balance of a specific address in real-time.

%%demo/examples/src/appkit/actions/balances#WATCH_BALANCE_BY_ADDRESS%%

## Connectors

### `connect`

Connect a wallet using a specific connector.

%%demo/examples/src/appkit/actions/connectors#CONNECT%%

### `addConnector`

Add a wallet connector to AppKit (e.g., TonConnect).

%%demo/examples/src/appkit/actions/connectors#ADD_CONNECTOR%%

### `disconnect`

Disconnect a wallet using a specific connector.

%%demo/examples/src/appkit/actions/connectors#DISCONNECT%%

### `getConnectors`

Get all available connectors.

%%demo/examples/src/appkit/actions/connectors#GET_CONNECTORS%%

### `getConnectorById`

Get a specific connector by its ID.

%%demo/examples/src/appkit/actions/connectors#GET_CONNECTOR_BY_ID%%

### `watchConnectors`

Watch for changes in available connectors (e.g., when a wallet connects).

%%demo/examples/src/appkit/actions/connectors#WATCH_CONNECTORS%%

### `watchConnectorById`

Watch for changes in a specific connector.

%%demo/examples/src/appkit/actions/connectors#WATCH_CONNECTOR_BY_ID%%

## Jettons

### `getJettons`

Get all jettons owned by the currently selected wallet.

%%demo/examples/src/appkit/actions/jettons#GET_JETTONS%%

### `getJettonsByAddress`

Get all jettons owned by a specific address.

%%demo/examples/src/appkit/actions/jettons#GET_JETTONS_BY_ADDRESS%%

### `getJettonBalance`

Get the balance of a specific jetton for a wallet address.

%%demo/examples/src/appkit/actions/jettons#GET_JETTON_BALANCE%%

### `getJettonInfo`

Get information about a specific jetton by its address.

%%demo/examples/src/appkit/actions/jettons#GET_JETTON_INFO%%

### `getJettonWalletAddress`

Get the jetton wallet address for a specific jetton and owner address.

%%demo/examples/src/appkit/actions/jettons#GET_JETTON_WALLET_ADDRESS%%

### `createTransferJettonTransaction`

Create a transaction for transferring jettons without sending it.

%%demo/examples/src/appkit/actions/jettons#CREATE_TRANSFER_JETTON_TRANSACTION%%

### `transferJetton`

Transfer jettons to a recipient address.

%%demo/examples/src/appkit/actions/jettons#TRANSFER_JETTON%%

## Networks

### `getNetwork`

Get the network of the currently selected wallet.

%%demo/examples/src/appkit/actions/network#GET_NETWORK%%

### `getNetworks`

Get all configured networks.

%%demo/examples/src/appkit/actions/network#GET_NETWORKS%%

### `getApiClient`

Get the API client for a specific network.

%%demo/examples/src/appkit/actions/network#GET_API_CLIENT%%

### `watchNetworks`

Watch configured networks.

%%demo/examples/src/appkit/actions/network#WATCH_NETWORKS%%

### `hasStreamingProvider`

Check if a real-time streaming provider is registered for a specific network.

%%demo/examples/src/appkit/actions/network#HAS_STREAMING_PROVIDER%%

### `getBlockNumber`

Get the current masterchain block number.

%%demo/examples/src/appkit/actions/network#GET_BLOCK_NUMBER%%

### `getDefaultNetwork`

Get the currently configured default network.

%%demo/examples/src/appkit/actions/network#GET_DEFAULT_NETWORK%%

### `setDefaultNetwork`

Set the default network for wallet connections. If set, connectors (e.g. TonConnect) will enforce this network when connecting a wallet. Pass `undefined` to allow any network.

%%demo/examples/src/appkit/actions/network#SET_DEFAULT_NETWORK%%

### `watchDefaultNetwork`

Watch for changes in the default network.

%%demo/examples/src/appkit/actions/network#WATCH_DEFAULT_NETWORK%%

## NFTs

### `getNfts`

Get all NFTs owned by the currently selected wallet.

%%demo/examples/src/appkit/actions/nft#GET_NFTS%%

### `getNftsByAddress`

Get all NFTs owned by a specific address.

%%demo/examples/src/appkit/actions/nft#GET_NFTS_BY_ADDRESS%%

### `getNft`

Get information about a specific NFT by its address.

%%demo/examples/src/appkit/actions/nft#GET_NFT%%

### `createTransferNftTransaction`

Create a transaction for transferring a NFT without sending it.

%%demo/examples/src/appkit/actions/nft#CREATE_TRANSFER_NFT_TRANSACTION%%

### `transferNft`

Transfer a NFT to a recipient address.

%%demo/examples/src/appkit/actions/nft#TRANSFER_NFT%%

## Onramp

### `getOnrampManager`

Get the `OnrampManager` instance.

### `getOnrampProvider`

Get a specific onramp provider by its ID.

### `getOnrampProviders`

Get all registered onramp providers.

### `watchOnrampProviders`

Watch for new onramp providers registration.

### `getOnrampQuote`

Get an onramp quote from registered providers.

%%demo/examples/src/appkit/actions/onramp#GET_ONRAMP_QUOTE%%

### `buildOnrampUrl`

Build an onramp URL for redirecting the user to the provider.

%%demo/examples/src/appkit/actions/onramp#BUILD_ONRAMP_URL%%

## Crypto Onramp

### `getCryptoOnrampProvider`

Get a registered crypto-onramp provider by id, or the default one when no id is given.

%%demo/examples/src/appkit/actions/onramp#GET_CRYPTO_ONRAMP_PROVIDER%%

### `getCryptoOnrampProviders`

Get all registered crypto-onramp providers.

%%demo/examples/src/appkit/actions/onramp#GET_CRYPTO_ONRAMP_PROVIDERS%%

### `watchCryptoOnrampProviders`

Watch for new crypto-onramp providers registration and default-provider changes.

## Providers

### `registerProvider`

Register a custom provider in AppKit (e.g., Swap or Streaming).

%%demo/examples/src/appkit/actions/providers#REGISTER_PROVIDER%%

## Signing

### `signText`

Sign a text message with the connected wallet.

%%demo/examples/src/appkit/actions/signing#SIGN_TEXT%%

### `signBinary`

Sign binary data with the connected wallet.

%%demo/examples/src/appkit/actions/signing#SIGN_BINARY%%

### `signCell`

Sign a TON Cell with the connected wallet. Used for on-chain signature verification.

%%demo/examples/src/appkit/actions/signing#SIGN_CELL%%

## Swap

### `getSwapManager`

Get the `SwapManager` instance to interact with swap providers directly.

%%demo/examples/src/appkit/actions/swap#GET_SWAP_MANAGER%%

### `getSwapProvider`

Get a specific swap provider by its ID.

%%demo/examples/src/appkit/actions/swap#GET_SWAP_PROVIDER%%

### `getSwapProviders`

Get all registered swap providers. The returned array keeps a stable reference until the provider list changes.

%%demo/examples/src/appkit/actions/swap#GET_SWAP_PROVIDERS%%

### `setDefaultSwapProvider`

Set the default swap provider. Subsequent quote and swap-transaction calls will use this provider when none is specified.

%%demo/examples/src/appkit/actions/swap#SET_DEFAULT_SWAP_PROVIDER%%

### `watchSwapProviders`

Watch for new swap providers registration.

%%demo/examples/src/appkit/actions/swap#WATCH_SWAP_PROVIDERS%%

### `getSwapQuote`

Get a swap quote from registered providers.

%%demo/examples/src/appkit/actions/swap#GET_SWAP_QUOTE%%

### `buildSwapTransaction`

Build (assemble) a swap transaction based on a quote. After the transaction is built, you can use `sendTransaction` to execute it on the blockchain.

%%demo/examples/src/appkit/actions/swap#BUILD_SWAP_TRANSACTION%%

## Staking

### `getStakingProviders`

Get all available staking provider IDs.

%%demo/examples/src/appkit/actions/staking#GET_STAKING_PROVIDERS%%

### `getStakingProviderInfo`

Get dynamic information about a specific staking provider (e.g. APY, rate).

%%demo/examples/src/appkit/actions/staking#GET_STAKING_PROVIDER_INFO%%

### `getStakingProviderMetadata`

Get static metadata about a specific staking provider.

%%demo/examples/src/appkit/actions/staking#GET_STAKING_PROVIDER_METADATA%%

### `getStakingQuote`

Get a staking or unstaking quote.

%%demo/examples/src/appkit/actions/staking#GET_STAKING_QUOTE%%

### `buildStakeTransaction`

Build a stake transaction based on a quote.

%%demo/examples/src/appkit/actions/staking#BUILD_STAKE_TRANSACTION%%

### `getStakedBalance`

Get the user's staked balance.

%%demo/examples/src/appkit/actions/staking#GET_STAKED_BALANCE%%

## Transaction

### `createTransferTonTransaction`
 
Create a TON transfer transaction request without sending it.
 
%%demo/examples/src/appkit/actions/transaction#CREATE_TRANSFER_TON_TRANSACTION%%

### `sendTransaction`
 
Send a transaction to the blockchain.
 
%%demo/examples/src/appkit/actions/transaction#SEND_TRANSACTION%%
 
### `transferTon`
 
Transfer TON to a recipient address.
 
%%demo/examples/src/appkit/actions/transaction#TRANSFER_TON%%

## Wallets

### `getConnectedWallets`

Get all connected wallets.

%%demo/examples/src/appkit/actions/wallets#GET_CONNECTED_WALLETS%%

### `getSelectedWallet`

Get the currently selected wallet.

%%demo/examples/src/appkit/actions/wallets#GET_SELECTED_WALLET%%

### `setSelectedWalletId`

Set the currently selected wallet by its ID.

%%demo/examples/src/appkit/actions/wallets#SET_SELECTED_WALLET_ID%%

### `watchConnectedWallets`

Watch for changes in the list of connected wallets.

%%demo/examples/src/appkit/actions/wallets#WATCH_CONNECTED_WALLETS%%

### `watchSelectedWallet`

Watch for changes in the selected wallet.

%%demo/examples/src/appkit/actions/wallets#WATCH_SELECTED_WALLET%%
