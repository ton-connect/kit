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

export const api: WalletKitBridgeApi = {
    // Initialization
    init: initialization.init,
    setEventsListeners: initialization.setEventsListeners,
    removeEventListeners: initialization.removeEventListeners,

    // Cryptography
    mnemonicToKeyPair: cryptography.mnemonicToKeyPair,
    sign: cryptography.sign,
    createTonMnemonic: cryptography.createTonMnemonic,

    // Wallets — 3-step factory
    createSignerFromMnemonic: wallets.createSignerFromMnemonic,
    createSignerFromPrivateKey: wallets.createSignerFromPrivateKey,
    createSignerFromCustom: wallets.createSignerFromCustom,
    createV5R1WalletAdapter: wallets.createV5R1WalletAdapter,
    createV4R2WalletAdapter: wallets.createV4R2WalletAdapter,

    // Wallets — unified addWallet (registry path + proxy adapter path)
    addWallet: wallets.addWallet,
    releaseRef: wallets.releaseRef,
    getWallets: wallets.getWallets,
    getWallet: wallets.getWalletById,
    getWalletAddress: wallets.getWalletAddress,
    removeWallet: wallets.removeWallet,
    getBalance: wallets.getBalance,

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
} as unknown as WalletKitBridgeApi;
