/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// Balances
export {
    getBalanceByAddress,
    type GetBalanceByAddressOptions,
    type GetBalanceByAddressReturnType,
} from './balances/get-balance-by-address';
export { getBalance, type GetBalanceOptions, type GetBalanceReturnType } from './balances/get-balance';

// Connectors
export { addConnector, type AddConnectorParameters, type AddConnectorReturnType } from './connectors/add-connector';
export { connect, type ConnectParameters, type ConnectReturnType } from './connectors/connect';
export { disconnect, type DisconnectReturnType, type DisconnectParameters } from './connectors/disconnect';
export { getConnectors, type GetConnectorsReturnType } from './connectors/get-connectors';
export {
    watchConnectors,
    type WatchConnectorsParameters,
    type WatchConnectorsReturnType,
} from './connectors/watch-connectors';
export {
    getConnectorById,
    type GetConnectorByIdOptions,
    type GetConnectorByIdReturnType,
} from './connectors/get-connector-by-id';
export {
    watchConnectorById,
    type WatchConnectorByIdParameters,
    type WatchConnectorByIdReturnType,
} from './connectors/watch-connector-by-id';

// Jettons
export { getJettonInfo, type GetJettonInfoOptions, type GetJettonInfoReturnType } from './jettons/get-jetton-info';
export {
    getJettonWalletAddress,
    type GetJettonWalletAddressOptions,
    type GetJettonWalletAddressReturnType,
} from './jettons/get-jetton-wallet-address';
export {
    getJettonBalance,
    type GetJettonBalanceOptions,
    type GetJettonBalanceReturnType,
} from './jettons/get-jetton-balance';
export {
    getJettonsByAddress,
    type GetJettonsByAddressOptions,
    type GetJettonsByAddressReturnType,
} from './jettons/get-jettons-by-address';
export { getJettons, type GetJettonsOptions, type GetJettonsReturnType } from './jettons/get-jettons';
export {
    createTransferJettonTransaction,
    type CreateTransferJettonTransactionParameters,
    type CreateTransferJettonTransactionReturnType,
} from './jettons/create-transfer-jetton-transaction';
export {
    transferJetton,
    type TransferJettonParameters,
    type TransferJettonReturnType,
} from './jettons/transfer-jetton';

// Network
export { getNetworks, type GetNetworksReturnType } from './network/get-networks';
export { getNetwork, type GetNetworkReturnType } from './network/get-network';
export { watchNetworks, type WatchNetworksParameters, type WatchNetworksReturnType } from './network/watch-networks';
export { getDefaultNetwork, type GetDefaultNetworkReturnType } from './network/get-default-network';
export {
    setDefaultNetwork,
    type SetDefaultNetworkParameters,
    type SetDefaultNetworkReturnType,
} from './network/set-default-network';
export {
    watchDefaultNetwork,
    type WatchDefaultNetworkParameters,
    type WatchDefaultNetworkReturnType,
} from './network/watch-default-network';

// NFT
export {
    getNftsByAddress,
    type GetNftsByAddressOptions,
    type GetNftsByAddressReturnType,
} from './nft/get-nfts-by-address';
export { getNfts, type GetNftsOptions, type GetNftsReturnType } from './nft/get-nfts';
export { getNft, type GetNftOptions, type GetNftReturnType } from './nft/get-nft';
export { transferNft, type TransferNftParameters, type TransferNftReturnType } from './nft/transfer-nft';

// Providers
export { registerProvider, type RegisterProviderOptions } from './providers/register-provider';

// Signing
export { signText, type SignTextParameters, type SignTextReturnType } from './signing/sign-text';
export { signBinary, type SignBinaryParameters, type SignBinaryReturnType } from './signing/sign-binary';
export { signCell, type SignCellParameters, type SignCellReturnType } from './signing/sign-cell';

// Swap
export { getSwapManager, type GetSwapManagerReturnType } from './swap/get-swap-manager';
export { getSwapQuote, type GetSwapQuoteOptions, type GetSwapQuoteReturnType } from './swap/get-swap-quote';
export {
    buildSwapTransaction,
    type BuildSwapTransactionOptions,
    type BuildSwapTransactionReturnType,
} from './swap/build-swap-transaction';

// Transactions
export {
    sendTransaction,
    type SendTransactionParameters,
    type SendTransactionReturnType,
} from './transaction/send-transaction';
export { transferTon, type TransferTonParameters, type TransferTonReturnType } from './transaction/transfer-ton';
export {
    createTransferNftTransaction,
    type CreateTransferNftTransactionParameters,
    type CreateTransferNftTransactionReturnType,
} from './nft/create-transfer-nft-transaction';
export {
    createTransferTonTransaction,
    type CreateTransferTonTransactionParameters,
    type CreateTransferTonTransactionReturnType,
} from './transaction/create-transfer-ton-transaction';

// Wallets
export { getConnectedWallets, type GetConnectedWalletsReturnType } from './wallets/get-connected-wallets';
export { getSelectedWallet, type GetSelectedWalletReturnType } from './wallets/get-selected-wallet';
export {
    setSelectedWalletId,
    type SetSelectedWalletIdParameters,
    type SetSelectedWalletIdReturnType,
} from './wallets/set-selected-wallet-id';
export {
    watchSelectedWallet,
    type WatchSelectedWalletParameters,
    type WatchSelectedWalletReturnType,
} from './wallets/watch-selected-wallet';
export {
    watchConnectedWallets,
    type WatchConnectedWalletsParameters,
    type WatchConnectedWalletsReturnType,
} from './wallets/watch-connected-wallets';
