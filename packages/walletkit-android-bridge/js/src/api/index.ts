/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Aggregates all domain-specific bridge APIs into a single export.
 */
import type { WalletKitBridgeApi } from '../types';
import * as initialization from './initialization';
import * as cryptography from './cryptography';
import * as wallets from './wallets';
import * as transactions from './transactions';
import * as requests from './requests';
import * as tonconnect from './tonconnect';
import * as nft from './nft';
import * as jettons from './jettons';
import * as browser from './browser';
import { eventListeners } from './eventListeners';

export { eventListeners };

const apiImpl: WalletKitBridgeApi = {
    // Initialization
    init: initialization.init,
    setEventsListeners: initialization.setEventsListeners,
    removeEventListeners: initialization.removeEventListeners,

    // Cryptography
    derivePublicKeyFromMnemonic: cryptography.derivePublicKeyFromMnemonic,
    signDataWithMnemonic: cryptography.signDataWithMnemonic,
    createTonMnemonic: cryptography.createTonMnemonic,
    respondToSignRequest: cryptography.respondToSignRequest,

    // Wallets
    createV4R2WalletWithSigner: wallets.createV4R2WalletWithSigner,
    createV5R1WalletWithSigner: wallets.createV5R1WalletWithSigner,
    createV4R2WalletUsingMnemonic: wallets.createV4R2WalletUsingMnemonic,
    createV4R2WalletUsingSecretKey: wallets.createV4R2WalletUsingSecretKey,
    createV5R1WalletUsingMnemonic: wallets.createV5R1WalletUsingMnemonic,
    createV5R1WalletUsingSecretKey: wallets.createV5R1WalletUsingSecretKey,
    getWallets: wallets.getWallets,
    removeWallet: wallets.removeWallet,
    getWalletState: wallets.getWalletState,

    // Transactions
    getRecentTransactions: transactions.getRecentTransactions,
    createTransferTonTransaction: transactions.createTransferTonTransaction,
    createTransferMultiTonTransaction: transactions.createTransferMultiTonTransaction,
    getTransactionPreview: transactions.getTransactionPreview,
    handleNewTransaction: transactions.handleNewTransaction,
    sendTransaction: transactions.sendTransaction,

    // Requests
    approveConnectRequest: requests.approveConnectRequest,
    rejectConnectRequest: requests.rejectConnectRequest,
    approveTransactionRequest: requests.approveTransactionRequest,
    rejectTransactionRequest: requests.rejectTransactionRequest,
    approveSignDataRequest: requests.approveSignDataRequest,
    rejectSignDataRequest: requests.rejectSignDataRequest,

    // TonConnect & sessions
    handleTonConnectUrl: tonconnect.handleTonConnectUrl,
    listSessions: tonconnect.listSessions,
    disconnectSession: tonconnect.disconnectSession,
    processInternalBrowserRequest: tonconnect.processInternalBrowserRequest,

    // NFTs
    getNfts: nft.getNfts,
    getNft: nft.getNft,
    createTransferNftTransaction: nft.createTransferNftTransaction,
    createTransferNftRawTransaction: nft.createTransferNftRawTransaction,

    // Jettons
    getJettons: jettons.getJettons,
    createTransferJettonTransaction: jettons.createTransferJettonTransaction,
    getJettonBalance: jettons.getJettonBalance,
    getJettonWalletAddress: jettons.getJettonWalletAddress,

    // Browser events
    emitBrowserPageStarted: browser.emitBrowserPageStarted,
    emitBrowserPageFinished: browser.emitBrowserPageFinished,
    emitBrowserError: browser.emitBrowserError,
    emitBrowserBridgeRequest: browser.emitBrowserBridgeRequest,
};

export const api = apiImpl;

export type { BridgeEventListener } from './eventListeners';
