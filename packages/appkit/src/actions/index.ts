/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// Balances
export { getBalance, type GetBalanceOptions } from './balances/get-balance';
export {
    getBalanceOfSelectedWallet,
    type GetBalanceOfSelectedWalletOptions,
} from './balances/get-balance-of-selected-wallet';
export { getJettons, type GetJettonsOptions } from './balances/get-jettons';
export {
    getJettonsOfSelectedWallet,
    type GetJettonsOfSelectedWalletOptions,
} from './balances/get-jettons-of-selected-wallet';

// Jettons
export { getJettonInfo, type GetJettonInfoOptions, type GetJettonInfoReturnType } from './jettons/get-jetton-info';

// Transactions
export {
    sendTransaction,
    type SendTransactionParameters,
    type SendTransactionReturnType,
} from './transaction/send-transaction';
export { transferTon, type TransferTonParameters, type TransferTonReturnType } from './transaction/transfer-ton';
export { transferNft, type TransferNftParameters, type TransferNftReturnType } from './nft/transfer-nft';
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
export {
    createTransferJettonTransaction,
    type CreateTransferJettonTransactionParameters,
    type CreateTransferJettonTransactionReturnType,
} from './transaction/create-transfer-jetton-transaction';
export {
    transferJetton,
    type TransferJettonParameters,
    type TransferJettonReturnType,
} from './transaction/transfer-jetton';

// Wallets
export { connect, type ConnectParameters, type ConnectReturnType } from './wallets/connect';
export { disconnect, type DisconnectReturnType, type DisconnectParameters } from './wallets/disconnect';
export { getConnectors, type GetConnectorsReturnType } from './wallets/get-connectors';
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
export {
    watchConnectors,
    type WatchConnectorsParameters,
    type WatchConnectorsReturnType,
} from './wallets/watch-connectors';

// Network
export { getNetworks, type GetNetworksReturnType } from './network/get-networks';
export {
    getSelectedWalletNetwork,
    type GetSelectedWalletNetworkReturnType,
} from './network/get-selected-wallet-network';
export { watchNetworks, type WatchNetworksParameters, type WatchNetworksReturnType } from './network/watch-networks';

// Swap
export { getSwapManager, type GetSwapManagerReturnType } from './swap/get-swap-manager';
export { getSwapQuote, type GetSwapQuoteOptions, type GetSwapQuoteReturnType } from './swap/get-swap-quote';
export {
    buildSwapTransaction,
    type BuildSwapTransactionOptions,
    type BuildSwapTransactionReturnType,
} from './swap/build-swap-transaction';
export { registerSwapProvider, type RegisterSwapProviderOptions } from './swap/register-swap-provider';

// Signing
export { signText, type SignTextParameters, type SignTextReturnType } from './signing/sign-text';
export { signBinary, type SignBinaryParameters, type SignBinaryReturnType } from './signing/sign-binary';
export { signCell, type SignCellParameters, type SignCellReturnType } from './signing/sign-cell';
