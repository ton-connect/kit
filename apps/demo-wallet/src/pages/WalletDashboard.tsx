/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    useWallet,
    useWalletKit,
    useTonConnect,
    useTransactionRequests,
    useSignDataRequests,
    useIntents,
} from '@demo/wallet-core';

import {
    Layout,
    Button,
    Card,
    ConnectRequestModal,
    TransactionRequestModal,
    SignDataRequestModal,
    IntentRequestModal,
    BatchedIntentRequestModal,
    DisconnectNotifications,
    NftsCard,
    RecentTransactions,
    JettonsCard,
    WalletSwitcher,
} from '../components';
import { useTonWallet } from '../hooks';
import { createComponentLogger } from '../utils/logger';
import { usePasteHandler } from '../hooks/usePasteHandler';

// Create logger for wallet dashboard
const log = createComponentLogger('WalletDashboard');

export const WalletDashboard: React.FC = () => {
    const walletKit = useWalletKit();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [tonConnectUrl, setTonConnectUrl] = useState('');
    const [isConnecting, setIsConnecting] = useState(false);
    const navigate = useNavigate();

    const {
        balance,
        address,
        getAvailableWallets,
        updateBalance,
        savedWallets,
        activeWalletId,
        switchWallet,
        removeWallet,
        renameWallet,
        getActiveWallet,
    } = useWallet();
    const activeWallet = getActiveWallet();
    const network = activeWallet?.network || 'testnet';
    const {
        handleTonConnectUrl,
        pendingConnectRequest,
        isConnectModalOpen,
        approveConnectRequest,
        rejectConnectRequest,
    } = useTonConnect();
    const { pendingTransactionRequest, isTransactionModalOpen } = useTransactionRequests();
    const { pendingSignDataRequest, isSignDataModalOpen, approveSignDataRequest, rejectSignDataRequest } =
        useSignDataRequests();
    const {
        pendingIntentEvent,
        pendingBatchedIntentEvent,
        isIntentModalOpen,
        isBatchedIntentModalOpen,
        handleIntentUrl,
        isIntentUrl,
        approveIntent,
        rejectIntent,
        approveBatchedIntent,
        rejectBatchedIntent,
    } = useIntents();
    const { error } = useTonWallet();

    // Use the paste handler hook — route intent URLs to handleIntentUrl
    const handlePastedUrl = useCallback(
        async (url: string) => {
            if (isIntentUrl(url)) {
                log.info('Detected pasted intent URL, routing to intent handler');
                await handleIntentUrl(url);
            } else {
                await handleTonConnectUrl(url);
            }
        },
        [isIntentUrl, handleIntentUrl, handleTonConnectUrl],
    );
    usePasteHandler(handlePastedUrl);

    const handleRefreshBalance = useCallback(async () => {
        setIsRefreshing(true);
        try {
            await updateBalance();
        } catch (err) {
            log.error('Error refreshing balance:', err);
        } finally {
            setIsRefreshing(false);
        }
    }, [updateBalance]);

    const handleCopyAddress = useCallback(async () => {
        if (!address) return;

        try {
            await navigator.clipboard.writeText(address);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            log.error('Failed to copy address:', err);
        }
    }, [address]);

    const handleConnectDApp = useCallback(async () => {
        if (!tonConnectUrl.trim()) return;

        const url = tonConnectUrl.trim();
        setIsConnecting(true);
        try {
            if (isIntentUrl(url)) {
                log.info('Detected intent URL, routing to intent handler');
                await handleIntentUrl(url);
            } else {
                await handleTonConnectUrl(url);
            }
            setTonConnectUrl('');
        } catch (err) {
            log.error('Failed to process URL:', err);
        } finally {
            setIsConnecting(false);
        }
    }, [tonConnectUrl, handleTonConnectUrl, isIntentUrl, handleIntentUrl]);

    const handleTestDisconnectAll = useCallback(async () => {
        if (!walletKit) return;
        try {
            await walletKit.disconnect(); // Disconnect all sessions
            log.info('All sessions disconnected');
        } catch (err) {
            log.error('Failed to disconnect sessions:', err);
        }
    }, [walletKit]);

    const formatTonAmount = (amount: string): string => {
        const tonAmount = parseFloat(amount || '0') / 1000000000; // Convert nanoTON to TON
        return tonAmount.toFixed(4);
    };

    const handleSwitchWallet = async (walletId: string) => {
        try {
            await switchWallet(walletId);
        } catch (err) {
            log.error('Failed to switch wallet:', err);
        }
    };

    const handleRemoveWallet = (walletId: string) => {
        try {
            removeWallet(walletId);
        } catch (err) {
            log.error('Failed to remove wallet:', err);
        }
    };

    const handleRenameWallet = (walletId: string, newName: string) => {
        try {
            renameWallet(walletId, newName);
        } catch (err) {
            log.error('Failed to rename wallet:', err);
        }
    };

    return (
        <Layout title="TON Wallet" showLogout>
            <div className="space-y-6">
                {/* Wallet Switcher */}
                <WalletSwitcher
                    savedWallets={savedWallets}
                    activeWalletId={activeWalletId}
                    onSwitchWallet={handleSwitchWallet}
                    onRemoveWallet={handleRemoveWallet}
                    onRenameWallet={handleRenameWallet}
                />

                {/* Balance Card */}
                <Card className="relative">
                    <button
                        onClick={handleRefreshBalance}
                        disabled={isRefreshing}
                        className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50"
                        title="Refresh balance"
                        aria-label="Refresh balance"
                    >
                        <svg
                            className={`w-4 h-4 text-gray-500 ${isRefreshing ? 'animate-spin' : ''}`}
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        >
                            <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"></path>
                            <path d="M21 3v5h-5"></path>
                        </svg>
                    </button>

                    <div className="text-center space-y-4">
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Balance</h3>
                            <p className="text-3xl font-bold text-gray-900 mt-2">
                                {formatTonAmount(balance || '0')} TON
                            </p>
                        </div>

                        {address && (
                            <div className="flex items-center justify-center space-x-6">
                                <a
                                    href={`https://${network === 'testnet' ? 'testnet.' : network === 'tetra' ? 'tetra.' : ''}tonscan.org/address/${address}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all hover:scale-110"
                                    title="View on TONScan"
                                    aria-label="View on TONScan"
                                >
                                    <img src="https://tonscan.org/favicon.ico" alt="TONScan" className="w-6 h-6" />
                                </a>
                                <a
                                    href={`https://${network === 'testnet' ? 'testnet.' : network === 'tetra' ? 'tetra.' : ''}tonviewer.com/${address}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all hover:scale-110"
                                    title="View on TONViewer"
                                    aria-label="View on TONViewer"
                                >
                                    <img
                                        src="https://tonviewer.com/android-chrome-192x192.png"
                                        alt="TONViewer"
                                        className="w-6 h-6"
                                    />
                                </a>
                            </div>
                        )}

                        {address && (
                            <div className="bg-gray-50 rounded-md p-3">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-xs text-gray-500 uppercase tracking-wide">Address</p>
                                    <button
                                        onClick={handleCopyAddress}
                                        className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded hover:bg-gray-50 hover:text-gray-700 transition-colors"
                                        title="Copy address"
                                    >
                                        {isCopied ? (
                                            <>
                                                <svg
                                                    className="w-3 h-3 mr-1"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M5 13l4 4L19 7"
                                                    />
                                                </svg>
                                                Copied!
                                            </>
                                        ) : (
                                            <>
                                                <svg
                                                    className="w-3 h-3 mr-1"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                                    />
                                                </svg>
                                                Copy
                                            </>
                                        )}
                                    </button>
                                </div>
                                <p className="text-sm font-mono text-gray-700 break-all">{address}</p>
                            </div>
                        )}

                        <div className="flex space-x-3">
                            <Button onClick={() => navigate('/send')} className="flex-1" data-testid="send-button">
                                Send
                            </Button>

                            <Button variant="secondary" onClick={() => navigate('/swap')} className="flex-1">
                                Swap
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* Jettons Card */}
                <JettonsCard />

                {/* NFTs Card */}
                <NftsCard />

                {/* TON Connect URL Input */}
                <Card title="Connect to dApp / Handle Intent">
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="tonconnect-url" className="block text-sm font-medium text-gray-700 mb-2">
                                Paste TON Connect or Intent Link
                            </label>
                            <textarea
                                data-testid="tonconnect-url"
                                id="tonconnect-url"
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 resize-none text-black"
                                placeholder="tc://... or ton://... or https://... or intent URL"
                                value={tonConnectUrl}
                                onChange={(e) => setTonConnectUrl(e.target.value)}
                            />
                        </div>
                        <Button
                            data-testid="tonconnect-process"
                            onClick={handleConnectDApp}
                            isLoading={isConnecting}
                            disabled={!tonConnectUrl.trim() || isConnecting}
                            className="w-full"
                        >
                            {tonConnectUrl.trim() && isIntentUrl(tonConnectUrl.trim())
                                ? 'Process Intent'
                                : 'Connect to dApp'}
                        </Button>
                    </div>
                </Card>

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-red-800">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Disconnect Notifications */}
                <DisconnectNotifications />

                {/* Transaction History */}
                <RecentTransactions />

                {/* Development Test Section */}
                <Card title="Development Tools">
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600">Test disconnect event functionality</p>
                        <Button variant="secondary" onClick={handleTestDisconnectAll} className="w-full">
                            Test: Disconnect All Sessions
                        </Button>
                    </div>
                </Card>
            </div>

            {/* Connect Request Modal */}
            {pendingConnectRequest && (
                <ConnectRequestModal
                    request={pendingConnectRequest}
                    availableWallets={getAvailableWallets()}
                    savedWallets={savedWallets}
                    currentWallet={getAvailableWallets().find((w) => w.getWalletId() === activeWallet?.kitWalletId)}
                    isOpen={isConnectModalOpen}
                    onApprove={approveConnectRequest}
                    onReject={rejectConnectRequest}
                />
            )}

            {/* Transaction Request Modal */}
            {pendingTransactionRequest && (
                <TransactionRequestModal
                    request={pendingTransactionRequest}
                    savedWallets={savedWallets}
                    isOpen={isTransactionModalOpen}
                />
            )}

            {/* Sign Data Request Modal */}
            {pendingSignDataRequest && (
                <SignDataRequestModal
                    request={pendingSignDataRequest}
                    savedWallets={savedWallets}
                    isOpen={isSignDataModalOpen}
                    onApprove={approveSignDataRequest}
                    onReject={rejectSignDataRequest}
                />
            )}

            {/* Intent Request Modal */}
            {pendingIntentEvent && (
                <IntentRequestModal
                    event={pendingIntentEvent}
                    savedWallets={savedWallets}
                    isOpen={isIntentModalOpen}
                    onApprove={approveIntent}
                    onReject={rejectIntent}
                />
            )}

            {/* Batched Intent Request Modal */}
            {pendingBatchedIntentEvent && (
                <BatchedIntentRequestModal
                    batch={pendingBatchedIntentEvent}
                    savedWallets={savedWallets}
                    isOpen={isBatchedIntentModalOpen}
                    onApprove={approveBatchedIntent}
                    onReject={rejectBatchedIntent}
                />
            )}
        </Layout>
    );
};
