---
target: packages/appkit-react/docs/hooks.md
---

# Hooks

AppKit React provides a set of hooks to interact with the blockchain and wallets.

## Balances

### `useBalance`

Hook to get the TON balance of the currently selected wallet.

%%demo/examples/src/appkit/hooks/balances#USE_BALANCE%%

### `useBalanceByAddress`

Hook to fetch the TON balance of a specific address.

%%demo/examples/src/appkit/hooks/balances#USE_BALANCE_BY_ADDRESS%%

## Jettons

### `useJettons`

Hook to get all jettons owned by the currently selected wallet.

%%demo/examples/src/appkit/hooks/jettons#USE_JETTONS%%

### `useJettonsByAddress`

Hook to get all jettons owned by a specific address.

%%demo/examples/src/appkit/hooks/jettons#USE_JETTONS_BY_ADDRESS%%

### `useJettonBalanceByAddress`

Hook to get the balance of a specific jetton for a wallet address.

%%demo/examples/src/appkit/hooks/jettons#USE_JETTON_BALANCE_BY_ADDRESS%%

### `useJettonInfo`

Hook to get information about a specific jetton by its address.

%%demo/examples/src/appkit/hooks/jettons#USE_JETTON_INFO%%

### `useJettonWalletAddress`

Hook to get the jetton wallet address for a specific jetton and owner address.

%%demo/examples/src/appkit/hooks/jettons#USE_JETTON_WALLET_ADDRESS%%

### `useTransferJetton`

Hook to transfer jettons to a recipient address.

%%demo/examples/src/appkit/hooks/jettons#USE_TRANSFER_JETTON%%

## Network

### `useNetwork`

Hook to get network of the selected wallet.

%%demo/examples/src/appkit/hooks/network#USE_NETWORK%%

### `useNetworks`

Hook to get all configured networks.

%%demo/examples/src/appkit/hooks/network#USE_NETWORKS%%

## NFT

### `useNft`

Hook to get a single NFT.

%%demo/examples/src/appkit/hooks/nft#USE_NFT%%

### `useNfts`

Hook to get NFTs of the selected wallet.

%%demo/examples/src/appkit/hooks/nft#USE_NFTS%%

### `useNFTsByAddress`

Hook to get NFTs of a specific address.

%%demo/examples/src/appkit/hooks/nft#USE_NFTS_BY_ADDRESS%%

### `useTransferNft`

Hook to transfer NFT to another wallet.

%%demo/examples/src/appkit/hooks/nft#USE_TRANSFER_NFT%%

## Signing

### `useSignBinary`

Hook to sign binary data with the connected wallet.

%%demo/examples/src/appkit/hooks/signing#USE_SIGN_BINARY%%

### `useSignCell`

Hook to sign TON Cell data with the connected wallet.

%%demo/examples/src/appkit/hooks/signing#USE_SIGN_CELL%%

### `useSignText`

Hook to sign text messages with the connected wallet.

%%demo/examples/src/appkit/hooks/signing#USE_SIGN_TEXT%%

## Swap

### `useSwapQuote`

Hook to get a swap quote for a token pair.

%%demo/examples/src/appkit/hooks/swap#USE_SWAP_QUOTE%%

### `useBuildSwapTransaction`

Hook to build a transaction for a swap operation based on a quote.

%%demo/examples/src/appkit/hooks/swap#USE_BUILD_SWAP_TRANSACTION%%

## Transaction

### `useSendTransaction`

Hook to send a transaction to the blockchain.

%%demo/examples/src/appkit/hooks/transaction#USE_SEND_TRANSACTION%%

### `useTransferTon`

Hook to simplify transferring TON to another address.

%%demo/examples/src/appkit/hooks/transaction#USE_TRANSFER_TON%%

