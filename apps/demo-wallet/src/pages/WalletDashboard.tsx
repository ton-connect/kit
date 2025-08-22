import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import {
    Layout,
    Button,
    Card,
    ConnectRequestModal,
    TransactionRequestModal,
    SignDataRequestModal,
} from '../components';
import { useWallet, useTonConnect, useTransactionRequests, useSignDataRequests } from '../stores';
import { useTonWallet } from '../hooks';
import { createComponentLogger } from '../utils/logger';

// Create logger for wallet dashboard
const log = createComponentLogger('WalletDashboard');

export const WalletDashboard: React.FC = () => {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [tonConnectUrl, setTonConnectUrl] = useState('');
    const [isConnecting, setIsConnecting] = useState(false);
    const navigate = useNavigate();

    const { balance, address, transactions, getAvailableWallets } = useWallet();
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
    const { getBalance, error } = useTonWallet();

    const handleRefreshBalance = useCallback(async () => {
        setIsRefreshing(true);
        try {
            await getBalance();
        } catch (err) {
            log.error('Error refreshing balance:', err);
        } finally {
            setIsRefreshing(false);
        }
    }, [getBalance]);

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

    const formatTonAmount = (amount: string): string => {
        const tonAmount = parseFloat(amount || '0') / 1000000000; // Convert nanoTON to TON
        return tonAmount.toFixed(4);
    };

    const formatAddress = (addr: string): string => {
        if (!addr) return '';
        return `${addr.slice(0, 6)}...${addr.slice(-6)}`;
    };

    const formatTimestamp = (timestamp: number): string => {
        return new Date(timestamp).toLocaleString();
    };

    useEffect(() => {
        // Auto-refresh balance on mount
        if (!balance) {
            handleRefreshBalance();
        }
    }, [balance, handleRefreshBalance]);

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

                {/* Transaction History */}
                <Card title="Recent Transactions">
                    {transactions.length === 0 ? (
                        <div className="text-center py-8">
                            <div className="text-gray-400 mb-2">
                                <svg
                                    className="w-12 h-12 mx-auto"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                    />
                                </svg>
                            </div>
                            <p className="text-gray-500 text-sm">No transactions yet</p>
                            <p className="text-gray-400 text-xs mt-1">Your transaction history will appear here</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {transactions.slice(0, 10).map((tx) => (
                                <div
                                    key={tx.id}
                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                >
                                    <div className="flex items-center space-x-3">
                                        <div
                                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                                tx.type === 'send' ? 'bg-red-100' : 'bg-green-100'
                                            }`}
                                        >
                                            {tx.type === 'send' ? (
                                                <svg
                                                    className="w-4 h-4 text-red-600"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M7 11l5-5m0 0l5 5m-5-5v12"
                                                    />
                                                </svg>
                                            ) : (
                                                <svg
                                                    className="w-4 h-4 text-green-600"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M17 13l-5 5m0 0l-5-5m5 5V6"
                                                    />
                                                </svg>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">
                                                {tx.type === 'send' ? 'Sent' : 'Received'}
                                            </p>
                                            <p className="text-xs text-gray-500">{formatAddress(tx.address)}</p>
                                            <p className="text-xs text-gray-400">{formatTimestamp(tx.timestamp)}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p
                                            className={`text-sm font-medium ${
                                                tx.type === 'send' ? 'text-red-600' : 'text-green-600'
                                            }`}
                                        >
                                            {tx.type === 'send' ? '-' : '+'}
                                            {formatTonAmount(tx.amount)} TON
                                        </p>
                                        <p
                                            className={`text-xs ${
                                                tx.status === 'confirmed'
                                                    ? 'text-green-500'
                                                    : tx.status === 'failed'
                                                      ? 'text-red-500'
                                                      : 'text-yellow-500'
                                            }`}
                                        >
                                            {tx.status}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-4">
                    <Button
                        variant="secondary"
                        onClick={() => navigate('/receive')}
                        className="h-16 flex flex-col items-center justify-center space-y-1"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span className="text-sm">Receive</span>
                    </Button>

                    <Button
                        variant="secondary"
                        onClick={() => navigate('/history')}
                        className="h-16 flex flex-col items-center justify-center space-y-1"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                        <span className="text-sm">History</span>
                    </Button>
                </div>
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
