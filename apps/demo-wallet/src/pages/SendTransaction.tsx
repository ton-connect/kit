/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { isValidAddress } from '@ton/walletkit';
import type { Jetton, TONTransferRequest } from '@ton/walletkit';
import { useWallet, useJettons, useWalletKit, useAuth, getTransactionExplorerUrls } from '@demo/wallet-core';
import { toast } from 'sonner';

import { Layout, Button, Input, Card, AnimatedBalance, WalletSwitcher } from '../components';
import { createComponentLogger } from '../utils/logger';

import { getFormattedJettonInfo } from '@/utils/jetton';
import { useFormattedJetton } from '@/hooks/useFormattedJetton';

// Create logger for send transaction
const log = createComponentLogger('SendTransaction');

interface SelectedToken {
    type: 'TON' | 'JETTON';
    data?: Jetton;
}

export const SendTransaction: React.FC = () => {
    const walletKit = useWalletKit();
    const [recipient, setRecipient] = useState('');
    const [amount, setAmount] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedToken, setSelectedToken] = useState<SelectedToken>({ type: 'TON' });
    const [showTokenSelector, setShowTokenSelector] = useState(false);
    const tokenSelectorRef = useRef<HTMLDivElement>(null);

    const navigate = useNavigate();
    const { balance, currentWallet, address, savedWallets, activeWalletId, switchWallet, removeWallet, renameWallet } =
        useWallet();
    const { showFastSend } = useAuth();
    const network = savedWallets.find((w) => w.id === activeWalletId)?.network ?? 'testnet';
    const { userJettons, isLoadingJettons, loadUserJettons, formatJettonAmount } = useJettons();

    const selectedJettonInfo = useFormattedJetton(selectedToken?.data);
    const getJettonInfo = (jetton: Jetton) => getFormattedJettonInfo(formatJettonAmount)(jetton);

    useEffect(() => {
        loadUserJettons();
    }, [loadUserJettons]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (showTokenSelector && tokenSelectorRef.current && !tokenSelectorRef.current.contains(e.target as Node)) {
                setShowTokenSelector(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showTokenSelector]);

    const formatTonAmount = (amountStr: string): string => {
        const tonAmount = parseFloat(amountStr || '0') / 1000000000;
        return tonAmount.toFixed(4);
    };

    const getCurrentTokenBalance = (): string => {
        if (selectedToken.type === 'TON') {
            return formatTonAmount(balance || '0');
        }
        return selectedJettonInfo?.balance || '0';
    };

    const getCurrentTokenSymbol = (): string => {
        if (selectedToken.type === 'TON') return 'TON';
        return selectedJettonInfo?.symbol || '';
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            if (!isValidAddress(recipient)) {
                throw new Error('Invalid recipient address');
            }

            const inputAmount = parseFloat(amount);
            if (inputAmount <= 0) {
                throw new Error('Amount must be greater than 0');
            }

            const currentBalance = parseFloat(getCurrentTokenBalance());
            if (inputAmount > currentBalance) {
                throw new Error('Insufficient balance');
            }

            if (!currentWallet) {
                throw new Error('No wallet available');
            }

            if (selectedToken.type === 'TON') {
                const nanoTonAmount = Math.floor(inputAmount * 1000000000).toString();
                const tonTransferParams: TONTransferRequest = {
                    recipientAddress: recipient,
                    transferAmount: nanoTonAmount,
                };
                const result = await currentWallet.createTransferTonTransaction(tonTransferParams);
                if (walletKit) {
                    await walletKit.handleNewTransaction(currentWallet, result);
                }
            } else if (selectedToken.data) {
                const decimals = selectedToken.data.decimalsNumber;
                if (!decimals) throw new Error('Jetton decimals not found');

                const jettonAmount = Math.floor(inputAmount * Math.pow(10, decimals)).toString();
                const jettonTransaction = await currentWallet.createTransferJettonTransaction({
                    recipientAddress: recipient,
                    jettonAddress: selectedToken.data.address,
                    transferAmount: jettonAmount,
                });
                if (walletKit) {
                    await walletKit.handleNewTransaction(currentWallet, jettonTransaction);
                }
            }

            navigate('/wallet', {
                state: { message: `${getCurrentTokenSymbol()} sent successfully!` },
            });
        } catch (err) {
            log.error('Send transaction error:', err);
            setError(err instanceof Error ? err.message : 'Failed to send transaction');
        } finally {
            setIsLoading(false);
        }
    };

    const handleMaxAmount = () => {
        const currentBalance = parseFloat(getCurrentTokenBalance());
        if (selectedToken.type === 'TON') {
            const maxAmount = currentBalance - 0.01;
            if (maxAmount > 0) setAmount(maxAmount.toString());
        } else if (currentBalance > 0) {
            setAmount(currentBalance.toString());
        }
    };

    const handleSendToSelf = () => {
        if (address) setRecipient(address);
    };

    const handleFastSend = async () => {
        if (!currentWallet) return;
        const recipientAddress = recipient.trim() || address;
        if (!recipientAddress) return;
        if (!isValidAddress(recipientAddress)) {
            setError('Invalid recipient address');
            return;
        }
        setError('');
        setIsLoading(true);
        try {
            let result;
            if (selectedToken.type === 'TON') {
                const tonTransferParams: TONTransferRequest = {
                    recipientAddress: recipientAddress,
                    transferAmount: '1000000',
                };
                const tx = await currentWallet.createTransferTonTransaction(tonTransferParams);
                result = await currentWallet.sendTransaction(tx);
            } else if (selectedToken.data) {
                const jettonTransaction = await currentWallet.createTransferJettonTransaction({
                    recipientAddress: recipientAddress,
                    jettonAddress: selectedToken.data.address,
                    transferAmount: '1',
                });
                result = await currentWallet.sendTransaction(jettonTransaction);
            }
            if (result?.normalizedHash) {
                const { tonScan, tonViewer } = getTransactionExplorerUrls(result.normalizedHash, network);
                toast.success('Transaction is sent to the network', {
                    description: (
                        <span className="flex gap-3 mt-1">
                            <a
                                href={tonScan}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 underline"
                            >
                                TonScan
                            </a>
                            <a
                                href={tonViewer}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 underline"
                            >
                                TonViewer
                            </a>
                        </span>
                    ),
                });
            }
        } catch (err) {
            log.error('Fast send error:', err);
            setError(err instanceof Error ? err.message : 'Failed to send');
        } finally {
            setIsLoading(false);
        }
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

    const balanceForAnimated = selectedToken.type === 'TON' ? balance : undefined;
    const isSendDisabled = !currentWallet || !recipient || !amount || parseFloat(amount) <= 0;
    const isSendFastDisabled = !currentWallet || !address;

    return (
        <Layout title={`Send ${getCurrentTokenSymbol()}`} showLogout onBack={() => navigate('/wallet')}>
            <div className="space-y-4">
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

                        {!currentWallet ? (
                            <div className="py-4 text-center">
                                <p className="text-sm text-gray-600 mb-2">Loading wallet...</p>
                                <Button variant="secondary" size="sm" onClick={() => navigate('/wallet')}>
                                    Back to wallet
                                </Button>
                            </div>
                        ) : (
                            <>
                                {/* Row 2: Token selector + balance */}
                                <div ref={tokenSelectorRef} className="relative">
                                    <div className="flex items-center justify-between gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowTokenSelector(!showTokenSelector)}
                                            className="flex items-center gap-2 min-w-0 flex-1 py-1 rounded hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden bg-blue-100">
                                                {selectedToken.type === 'TON' ? (
                                                    <span className="text-sm font-bold text-blue-600">T</span>
                                                ) : selectedJettonInfo ? (
                                                    selectedJettonInfo.image ? (
                                                        <img
                                                            src={selectedJettonInfo.image}
                                                            alt=""
                                                            className="w-6 h-6 rounded-full object-cover"
                                                            onError={(e) => {
                                                                const target = e.target as HTMLImageElement;
                                                                target.style.display = 'none';
                                                                const parent = target.parentElement;
                                                                if (parent) {
                                                                    parent.innerHTML =
                                                                        selectedJettonInfo?.symbol
                                                                            ?.slice(0, 2)
                                                                            ?.toUpperCase() || '?';
                                                                    parent.className =
                                                                        'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 text-xs font-bold text-white';
                                                                }
                                                            }}
                                                        />
                                                    ) : (
                                                        <span className="text-xs font-bold text-white bg-gradient-to-br from-blue-500 to-purple-600 rounded-full w-6 h-6 flex items-center justify-center">
                                                            {selectedJettonInfo.symbol?.slice(0, 2).toUpperCase() ||
                                                                '?'}
                                                        </span>
                                                    )
                                                ) : (
                                                    <span className="text-xs font-bold text-gray-600">?</span>
                                                )}
                                            </div>
                                            <span className="text-sm font-medium text-gray-900 truncate">
                                                {selectedToken.type === 'TON'
                                                    ? 'TON'
                                                    : selectedJettonInfo
                                                      ? selectedJettonInfo.name || selectedJettonInfo.symbol
                                                      : '?'}
                                            </span>
                                            <svg
                                                className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${
                                                    showTokenSelector ? 'rotate-180' : ''
                                                }`}
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M19 9l-7 7-7-7"
                                                />
                                            </svg>
                                        </button>
                                        <p className="text-xl font-bold text-gray-900 truncate">
                                            {selectedToken.type === 'TON' ? (
                                                <AnimatedBalance balance={balanceForAnimated} />
                                            ) : (
                                                <>
                                                    {getCurrentTokenBalance()} {getCurrentTokenSymbol()}
                                                </>
                                            )}
                                        </p>
                                    </div>

                                    {/* Absolute dropdown - does not affect layout */}
                                    {showTokenSelector && (
                                        <div className="absolute left-0 right-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedToken({ type: 'TON' });
                                                    setShowTokenSelector(false);
                                                    setAmount('');
                                                }}
                                                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left ${
                                                    selectedToken.type === 'TON' ? 'bg-blue-50' : 'hover:bg-gray-50'
                                                }`}
                                            >
                                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                    <span className="text-sm font-bold text-blue-600">T</span>
                                                </div>
                                                <div className="text-left min-w-0">
                                                    <p className="text-sm font-medium text-gray-900">TON</p>
                                                    <p className="text-xs text-gray-500">
                                                        {formatTonAmount(balance || '0')} TON
                                                    </p>
                                                </div>
                                            </button>
                                            {userJettons.map((jetton) => {
                                                const jettonInfo = getJettonInfo(jetton);
                                                const isSelected =
                                                    selectedToken.type === 'JETTON' &&
                                                    selectedToken.data?.address === jetton.address;
                                                return (
                                                    <button
                                                        key={jetton.address}
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedToken({ type: 'JETTON', data: jetton });
                                                            setShowTokenSelector(false);
                                                            setAmount('');
                                                        }}
                                                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-left ${
                                                            isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 bg-gray-100">
                                                            {jettonInfo.image ? (
                                                                <img
                                                                    src={jettonInfo.image}
                                                                    alt=""
                                                                    className="w-6 h-6 rounded-full object-cover"
                                                                    onError={(e) => {
                                                                        const target = e.target as HTMLImageElement;
                                                                        target.style.display = 'none';
                                                                        const parent = target.parentElement;
                                                                        if (parent) {
                                                                            parent.innerHTML =
                                                                                jettonInfo.symbol
                                                                                    ?.slice(0, 2)
                                                                                    ?.toUpperCase() || '?';
                                                                            parent.className =
                                                                                'w-8 h-8 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 bg-gradient-to-br from-blue-500 to-purple-600 text-xs font-bold text-white';
                                                                        }
                                                                    }}
                                                                />
                                                            ) : (
                                                                <span className="text-xs font-bold text-white bg-gradient-to-br from-blue-500 to-purple-600 rounded-full w-6 h-6 flex items-center justify-center">
                                                                    {jettonInfo.symbol?.slice(0, 2).toUpperCase() ||
                                                                        '?'}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-left min-w-0 flex-1">
                                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                                {jettonInfo.name || jettonInfo.symbol}
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                {jettonInfo.balance} {jettonInfo.symbol}
                                                            </p>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                            {userJettons.length === 0 && !isLoadingJettons && (
                                                <div className="py-4 text-center text-gray-500 text-sm">
                                                    No jettons found
                                                </div>
                                            )}
                                            {isLoadingJettons && (
                                                <div className="py-4 text-center text-gray-500 text-sm">
                                                    Loading tokens...
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <form onSubmit={handleSend} className="space-y-3">
                                    {/* Row 3: Recipient */}
                                    <div>
                                        <div className="flex items-center justify-between mb-1">
                                            <label className="block text-sm font-medium text-gray-700">
                                                Recipient Address
                                            </label>
                                            {address && (
                                                <button
                                                    type="button"
                                                    onClick={handleSendToSelf}
                                                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                                                    data-testid="use-my-address"
                                                >
                                                    Use my address
                                                </button>
                                            )}
                                        </div>
                                        <Input
                                            value={recipient}
                                            onChange={(e) => setRecipient(e.target.value)}
                                            placeholder="EQxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                                            required
                                            data-testid="recipient-input"
                                        />
                                    </div>

                                    {/* Row 4: Amount + Max */}
                                    <div>
                                        <div className="flex items-center justify-between mb-1">
                                            <label className="block text-sm font-medium text-gray-700">
                                                Amount ({getCurrentTokenSymbol()})
                                            </label>
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                size="sm"
                                                onClick={handleMaxAmount}
                                            >
                                                Max
                                            </Button>
                                        </div>
                                        <Input
                                            type="number"
                                            step={selectedToken.type === 'TON' ? '0.000000001' : '0.000000001'}
                                            min="0"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            placeholder="0.0000"
                                            required
                                            data-testid="amount-input"
                                        />
                                    </div>

                                    {/* Transaction summary */}
                                    {recipient && amount && parseFloat(amount) > 0 && (
                                        <div className="bg-gray-50 rounded-md p-3 space-y-1 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">To:</span>
                                                <span className="font-mono">
                                                    {recipient.slice(0, 6)}...{recipient.slice(-6)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Amount:</span>
                                                <span>
                                                    {amount} {getCurrentTokenSymbol()}
                                                </span>
                                            </div>
                                            <div className="flex justify-between font-medium pt-1">
                                                <span>You'll send:</span>
                                                <span>
                                                    {amount} {getCurrentTokenSymbol()}
                                                </span>
                                            </div>
                                            {selectedToken.type === 'JETTON' && (
                                                <p className="text-xs text-blue-700 pt-1">
                                                    TON fees will be deducted separately.
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {error && <div className="text-red-600 text-sm text-center">{error}</div>}

                                    {/* Send buttons */}
                                    <div className="flex gap-2">
                                        {showFastSend && (
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                onClick={handleFastSend}
                                                isLoading={isLoading}
                                                disabled={isSendFastDisabled}
                                                className="flex-1"
                                                data-testid="send-fast"
                                            >
                                                Send Fast
                                            </Button>
                                        )}
                                        <Button
                                            type="submit"
                                            isLoading={isLoading}
                                            disabled={isSendDisabled}
                                            className="flex-1"
                                            data-testid="send-submit"
                                        >
                                            {isLoading ? `Sending...` : `Send ${getCurrentTokenSymbol()}`}
                                        </Button>
                                    </div>
                                </form>
                            </>
                        )}
                    </div>
                </Card>

                {/* Warning - compact */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                    <p className="text-sm text-yellow-800">
                        Double-check the recipient address. Blockchain transactions are irreversible.
                    </p>
                </div>
            </div>
        </Layout>
    );
};
