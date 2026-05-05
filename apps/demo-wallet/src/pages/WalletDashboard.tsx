/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet, useWalletKit, useTonConnect, useTransactionRequests, useSignDataRequests } from '@demo/wallet-core';

import {
    AnimatedBalance,
    Layout,
    Button,
    Card,
    ConnectRequestModal,
    TransactionRequestModal,
    SignDataRequestModal,
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
        loadEvents,
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
    const { error } = useTonWallet();

    // Use the paste handler hook
    usePasteHandler(handleTonConnectUrl);

    const handleRefreshBalance = useCallback(async () => {
        setIsRefreshing(true);
        try {
            await Promise.all([updateBalance(), loadEvents(10, 0)]);
        } catch (err) {
            log.error('Error refreshing balance:', err);
        } finally {
            setIsRefreshing(false);
        }
    }, [updateBalance, loadEvents]);

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

        setIsConnecting(true);
        try {
            await handleTonConnectUrl(tonConnectUrl.trim());
            setTonConnectUrl('');
        } catch (err) {
            log.error('Failed to connect to dApp:', err);
            // TODO: Show error message to user
        } finally {
            setIsConnecting(false);
        }
    }, [tonConnectUrl, handleTonConnectUrl]);

    const handleTestDisconnectAll = useCallback(async () => {
        if (!walletKit) return;
        try {
            await walletKit.disconnect(); // Disconnect all sessions
            log.info('All sessions disconnected');
        } catch (err) {
            log.error('Failed to disconnect sessions:', err);
        }
    }, [walletKit]);

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
            <div className="space-y-4">
                {/* Wallet Card: selector + balance + address + send/swap/stake + jettons + history */}
                <Card compact>
                    <div className="space-y-3">
                        {/* Row 1: Wallet selector */}
                        <WalletSwitcher
                            savedWallets={savedWallets}
                            activeWalletId={activeWalletId}
                            onSwitchWallet={handleSwitchWallet}
                            onRemoveWallet={handleRemoveWallet}
                            onRenameWallet={handleRenameWallet}
                            compact
                        />

                        {/* Row 2: Balance */}
                        <p className="text-xl font-bold text-gray-900 truncate">
                            <AnimatedBalance balance={balance} />
                        </p>

                        {/* Row 3: Address with copy, refresh, TONScan, TONViewer */}
                        {address && (
                            <div className="flex items-center gap-1.5 min-w-0">
                                <span className="text-xs font-mono text-gray-600 truncate flex-1 min-w-0">
                                    {address.slice(0, 6)}...{address.slice(-4)}
                                </span>
                                <button
                                    onClick={handleCopyAddress}
                                    className="p-1 rounded hover:bg-gray-100 transition-colors flex-shrink-0"
                                    title="Copy address"
                                >
                                    {isCopied ? (
                                        <svg
                                            className="w-3.5 h-3.5 text-green-600"
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
                                    ) : (
                                        <svg
                                            className="w-3.5 h-3.5 text-gray-500"
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
                                    )}
                                </button>
                                <button
                                    onClick={handleRefreshBalance}
                                    disabled={isRefreshing}
                                    className="p-1 rounded hover:bg-gray-100 transition-colors disabled:opacity-50 flex-shrink-0"
                                    title="Refresh balance"
                                    aria-label="Refresh balance"
                                >
                                    <svg
                                        className={`w-3.5 h-3.5 text-gray-500 ${isRefreshing ? 'animate-spin' : ''}`}
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                                        <path d="M21 3v5h-5" />
                                    </svg>
                                </button>
                                <a
                                    href={`https://${network === 'testnet' ? 'testnet.' : network === 'tetra' ? 'tetra.' : ''}tonscan.org/address/${address}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1 rounded hover:bg-gray-100 flex-shrink-0"
                                    title="TONScan"
                                >
                                    <img src="https://tonscan.org/favicon.ico" alt="" className="w-4 h-4" />
                                </a>
                                <a
                                    href={`https://${network === 'testnet' ? 'testnet.' : network === 'tetra' ? 'tetra.' : ''}tonviewer.com/${address}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1 rounded hover:bg-gray-100 flex-shrink-0"
                                    title="TONViewer"
                                >
                                    <img
                                        src="https://tonviewer.com/android-chrome-192x192.png"
                                        alt=""
                                        className="w-4 h-4"
                                    />
                                </a>
                            </div>
                        )}

                        {/* Row 4: Send, Swap, Stake */}
                        <div className="flex gap-2">
                            <Button
                                onClick={() => navigate('/send')}
                                className="flex-1 py-2 text-sm"
                                data-testid="send-button"
                            >
                                Send
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={() => navigate('/swap')}
                                className="flex-1 py-2 text-sm"
                            >
                                Swap
                            </Button>

                            <Button
                                variant="secondary"
                                onClick={() => navigate('/staking')}
                                className="flex-1 py-2 text-sm"
                            >
                                Stake
                            </Button>
                        </div>

                        {/* Jettons (embedded in wallet card) */}
                        <JettonsCard embedded />

                        {/* History (embedded in wallet card) */}
                        <RecentTransactions embedded />
                    </div>
                </Card>

                {/* NFTs */}
                <NftsCard />

                {/* Connect to dApp */}
                <Card title="Connect to dApp" compact>
                    <div className="space-y-3">
                        <div>
                            <label htmlFor="tonconnect-url" className="block text-sm font-medium text-gray-700 mb-2">
                                Paste TON Connect Link
                            </label>
                            <textarea
                                data-testid="tonconnect-url"
                                id="tonconnect-url"
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 resize-none text-black"
                                placeholder="tc://... or ton://... or https://..."
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
                            Connect to dApp
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

                {/* Development Test Section */}
                <Card title="Development Tools" compact>
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
        </Layout>
    );
};
