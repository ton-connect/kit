import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import {
    Layout,
    Button,
    Card,
    ConnectRequestModal,
    TransactionRequestModal,
    SignDataRequestModal,
    DisconnectNotifications,
    JettonsCard,
    NftsCard,
    RecentTransactions,
} from '../components';
import { useWallet, useTonConnect, useTransactionRequests, useSignDataRequests, useAuth } from '../stores';
import { walletKit } from '../stores/slices/walletSlice';
import { useTonWallet } from '../hooks';
import { createComponentLogger } from '../utils/logger';
import { usePasteHandler } from '../hooks/usePasteHandler';

// Create logger for wallet dashboard
const log = createComponentLogger('WalletDashboard');

export const WalletDashboard: React.FC = () => {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [tonConnectUrl, setTonConnectUrl] = useState('');
    const [isConnecting, setIsConnecting] = useState(false);
    const navigate = useNavigate();

    const { balance, address, getAvailableWallets, updateBalance } = useWallet();
    const { persistPassword, setPersistPassword, useWalletInterfaceType, setUseWalletInterfaceType } = useAuth();
    const {
        handleTonConnectUrl,
        pendingConnectRequest,
        isConnectModalOpen,
        approveConnectRequest,
        rejectConnectRequest,
    } = useTonConnect();
    const { pendingTransactionRequest, isTransactionModalOpen, approveTransactionRequest, rejectTransactionRequest } =
        useTransactionRequests();
    const { pendingSignDataRequest, isSignDataModalOpen, approveSignDataRequest, rejectSignDataRequest } =
        useSignDataRequests();
    const { error } = useTonWallet();

    // Use the paste handler hook
    usePasteHandler(handleTonConnectUrl);

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
        try {
            await walletKit.disconnect(); // Disconnect all sessions
            log.info('All sessions disconnected');
        } catch (err) {
            log.error('Failed to disconnect sessions:', err);
        }
    }, []);

    const formatTonAmount = (amount: string): string => {
        const tonAmount = parseFloat(amount || '0') / 1000000000; // Convert nanoTON to TON
        return tonAmount.toFixed(4);
    };

    useEffect(() => {
        // Auto-refresh balance on mount
        if (!balance) {
            updateBalance();
        }
    }, [balance, updateBalance]);

    // auto refresh balance every 10 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            updateBalance();
        }, 10000);
        return () => clearInterval(interval);
    }, [updateBalance]);

    return (
        <Layout title="TON Wallet" showLogout>
            <div className="space-y-6">
                {/* Balance Card */}
                <Card>
                    <div className="text-center space-y-4">
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Balance</h3>
                            <p className="text-3xl font-bold text-gray-900 mt-2">
                                {formatTonAmount(balance || '0')} TON
                            </p>
                        </div>

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
                            <Button
                                variant="secondary"
                                onClick={handleRefreshBalance}
                                isLoading={isRefreshing}
                                className="flex-1"
                            >
                                Refresh
                            </Button>
                            <Button onClick={() => navigate('/send')} className="flex-1">
                                Send
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* Jettons Card */}
                <JettonsCard />

                {/* NFTs Card */}
                <NftsCard />

                {/* TON Connect URL Input */}
                <Card title="Connect to dApp">
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="tonconnect-url" className="block text-sm font-medium text-gray-700 mb-2">
                                Paste TON Connect Link
                            </label>
                            <textarea
                                id="tonconnect-url"
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 resize-none text-black"
                                placeholder="tc://... or ton://... or https://..."
                                value={tonConnectUrl}
                                onChange={(e) => setTonConnectUrl(e.target.value)}
                            />
                        </div>
                        <Button
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

                {/* Transaction History */}
                <RecentTransactions />

                {/* Settings Section */}
                <Card title="Settings">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <label className="text-sm font-medium text-gray-700">Remember Password</label>
                                <p className="text-xs text-gray-500 mt-1">Keep wallet unlocked between app reloads</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={persistPassword || false}
                                    onChange={(e) => setPersistPassword(e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                        {persistPassword && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg
                                            className="h-5 w-5 text-yellow-400"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm text-yellow-800">
                                            <strong>Security Notice:</strong> Storing your password locally is not safe,
                                            do not use this feature for anything other than development.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center justify-between">
                            <div>
                                <label className="text-sm font-medium text-gray-700">Wallet Interface Type</label>
                                <p className="text-xs text-gray-500 mt-1">
                                    Choose how the wallet handles signing operations
                                </p>
                            </div>
                            <select
                                className="px-3 py-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                                value={useWalletInterfaceType || 'mnemonic'}
                                onChange={(e) => setUseWalletInterfaceType(e.target.value as 'signer' | 'mnemonic')}
                            >
                                <option value="mnemonic">Mnemonic</option>
                                <option value="signer">Signer</option>
                            </select>
                        </div>
                    </div>
                </Card>

                {/* Development Test Section */}
                {process.env.NODE_ENV === 'development' && (
                    <Card title="Development Tools">
                        <div className="space-y-4">
                            <p className="text-sm text-gray-600">
                                Test disconnect event functionality (development only)
                            </p>
                            <Button variant="secondary" onClick={handleTestDisconnectAll} className="w-full">
                                Test: Disconnect All Sessions
                            </Button>
                        </div>
                    </Card>
                )}
            </div>

            {/* Connect Request Modal */}
            {pendingConnectRequest && (
                <ConnectRequestModal
                    request={pendingConnectRequest}
                    availableWallets={getAvailableWallets()}
                    isOpen={isConnectModalOpen}
                    onApprove={approveConnectRequest}
                    onReject={rejectConnectRequest}
                />
            )}

            {/* Transaction Request Modal */}
            {pendingTransactionRequest && (
                <TransactionRequestModal
                    request={pendingTransactionRequest}
                    isOpen={isTransactionModalOpen}
                    onApprove={approveTransactionRequest}
                    onReject={rejectTransactionRequest}
                />
            )}

            {/* Sign Data Request Modal */}
            {pendingSignDataRequest && (
                <SignDataRequestModal
                    request={pendingSignDataRequest}
                    isOpen={isSignDataModalOpen}
                    onApprove={approveSignDataRequest}
                    onReject={rejectSignDataRequest}
                />
            )}
        </Layout>
    );
};
