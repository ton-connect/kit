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

## Connectors

### `connect`

Connect a wallet using a specific connector.

%%demo/examples/src/appkit/actions/connectors#CONNECT%%

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

### `watchNetworks`

Watch configured networks.

%%demo/examples/src/appkit/actions/network#WATCH_NETWORKS%%

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
