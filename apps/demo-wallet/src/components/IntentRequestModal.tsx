/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { useState, useEffect, useMemo } from 'react';
import type {
    IntentRequestEvent,
    BatchedIntentEvent,
    TransactionIntentRequestEvent,
    SignDataIntentRequestEvent,
    ActionIntentRequestEvent,
    IntentActionItem,
    SendTonAction,
    SendJettonAction,
    SendNftAction,
} from '@ton/walletkit';
import { useAuth } from '@demo/wallet-core';
import type { SavedWallet } from '@demo/wallet-core';
import { Address } from '@ton/core';

import { Button } from './Button';
import { Card } from './Card';
import { HoldToSignButton } from './HoldToSignButton';
import { WalletPreview } from './WalletPreview';
import { createComponentLogger } from '../utils/logger';

const log = createComponentLogger('IntentRequestModal');

// ==================== Shared Renderers ====================

function truncateAddress(address: string): string {
    try {
        const addr = Address.parse(address);
        const friendly = addr.toString();
        return `${friendly.slice(0, 6)}...${friendly.slice(-4)}`;
    } catch {
        if (address.length > 16) {
            return `${address.slice(0, 8)}...${address.slice(-4)}`;
        }
        return address;
    }
}

function formatNano(amount: string): string {
    const n = BigInt(amount);
    const whole = n / 1_000_000_000n;
    const frac = n % 1_000_000_000n;
    if (frac === 0n) return `${whole}`;
    const fracStr = frac.toString().padStart(9, '0').replace(/0+$/, '');
    return `${whole}.${fracStr}`;
}

const ActionItemCard: React.FC<{ item: IntentActionItem; index: number }> = ({ item, index }) => {
    switch (item.type) {
        case 'sendTon': {
            const action = item.value as SendTonAction;
            return (
                <div className="border rounded-lg p-3 bg-blue-50">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-semibold bg-blue-200 text-blue-800 px-2 py-0.5 rounded">
                            #{index + 1} Send TON
                        </span>
                    </div>
                    <div className="space-y-1 text-sm">
                        <p>
                            <span className="font-medium">To:</span>{' '}
                            <span className="font-mono text-xs">{truncateAddress(action.address)}</span>
                        </p>
                        <p>
                            <span className="font-medium">Amount:</span> {formatNano(action.amount)} TON
                        </p>
                        {action.payload && (
                            <p className="text-xs text-gray-500 truncate">
                                <span className="font-medium">Payload:</span> {action.payload}
                            </p>
                        )}
                    </div>
                </div>
            );
        }
        case 'sendJetton': {
            const action = item.value as SendJettonAction;
            return (
                <div className="border rounded-lg p-3 bg-purple-50">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-semibold bg-purple-200 text-purple-800 px-2 py-0.5 rounded">
                            #{index + 1} Send Jetton
                        </span>
                    </div>
                    <div className="space-y-1 text-sm">
                        <p>
                            <span className="font-medium">Master:</span>{' '}
                            <span className="font-mono text-xs">{truncateAddress(action.jettonMasterAddress)}</span>
                        </p>
                        <p>
                            <span className="font-medium">Amount:</span> {action.jettonAmount}
                        </p>
                        <p>
                            <span className="font-medium">To:</span>{' '}
                            <span className="font-mono text-xs">{truncateAddress(action.destination)}</span>
                        </p>
                        {action.forwardTonAmount && (
                            <p>
                                <span className="font-medium">Forward TON:</span> {formatNano(action.forwardTonAmount)}
                            </p>
                        )}
                    </div>
                </div>
            );
        }
        case 'sendNft': {
            const action = item.value as SendNftAction;
            return (
                <div className="border rounded-lg p-3 bg-amber-50">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-semibold bg-amber-200 text-amber-800 px-2 py-0.5 rounded">
                            #{index + 1} Send NFT
                        </span>
                    </div>
                    <div className="space-y-1 text-sm">
                        <p>
                            <span className="font-medium">NFT:</span>{' '}
                            <span className="font-mono text-xs">{truncateAddress(action.nftAddress)}</span>
                        </p>
                        <p>
                            <span className="font-medium">New Owner:</span>{' '}
                            <span className="font-mono text-xs">{truncateAddress(action.newOwnerAddress)}</span>
                        </p>
                    </div>
                </div>
            );
        }
        default:
            return (
                <div className="border rounded-lg p-3 bg-gray-50">
                    <p className="text-sm text-gray-600">Unknown action type</p>
                </div>
            );
    }
};

const IntentEventDetails: React.FC<{ event: IntentRequestEvent }> = ({ event }) => {
    switch (event.type) {
        case 'transaction': {
            const tx = event.value as TransactionIntentRequestEvent;
            return (
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">
                            Transaction
                        </span>
                        <span className="text-xs text-gray-500">
                            delivery: <span className="font-medium">{tx.deliveryMode}</span>
                        </span>
                        {tx.network && <span className="text-xs text-gray-500">network: {tx.network.chainId}</span>}
                    </div>
                    {tx.validUntil && (
                        <p className="text-xs text-gray-500">
                            Valid until: {new Date(tx.validUntil * 1000).toLocaleString()}
                        </p>
                    )}
                    <div className="space-y-2">
                        {tx.items.map((item, i) => (
                            <ActionItemCard key={i} item={item} index={i} />
                        ))}
                    </div>
                </div>
            );
        }
        case 'signData': {
            const sd = event.value as SignDataIntentRequestEvent;
            return (
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold bg-green-100 text-green-800 px-2 py-0.5 rounded">
                            Sign Data
                        </span>
                        {sd.network && <span className="text-xs text-gray-500">network: {sd.network.chainId}</span>}
                    </div>
                    {sd.manifestUrl && <p className="text-xs text-gray-500 truncate">Manifest: {sd.manifestUrl}</p>}
                    <div className="border rounded-lg p-3 bg-green-50">
                        <p className="text-sm font-medium mb-1">Payload</p>
                        <pre className="text-xs overflow-x-auto whitespace-pre-wrap bg-white/50 p-2 rounded">
                            {JSON.stringify(sd.payload, null, 2)}
                        </pre>
                    </div>
                </div>
            );
        }
        case 'action': {
            const action = event.value as ActionIntentRequestEvent;
            return (
                <div className="space-y-3">
                    <span className="text-xs font-semibold bg-orange-100 text-orange-800 px-2 py-0.5 rounded">
                        Action
                    </span>
                    <p className="text-sm break-all">
                        <span className="font-medium">URL:</span> {action.actionUrl}
                    </p>
                </div>
            );
        }
        default:
            return <p className="text-sm text-gray-500">Unknown intent type</p>;
    }
};

// ==================== Single Intent Modal ====================

interface IntentRequestModalProps {
    event: IntentRequestEvent;
    savedWallets: SavedWallet[];
    isOpen: boolean;
    onApprove: () => Promise<void>;
    onReject: (reason?: string) => Promise<void>;
}

export const IntentRequestModal: React.FC<IntentRequestModalProps> = ({
    event,
    savedWallets,
    isOpen,
    onApprove,
    onReject,
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { holdToSign } = useAuth();

    const currentWallet = useMemo(() => {
        return savedWallets[0] || null;
    }, [savedWallets]);

    useEffect(() => {
        if (!isOpen) {
            setShowSuccess(false);
            setIsLoading(false);
            setError(null);
        }
    }, [isOpen]);

    const handleApprove = async () => {
        setIsLoading(true);
        setError(null);
        try {
            await onApprove();
            setIsLoading(false);
            setShowSuccess(true);
        } catch (err) {
            log.error('Failed to approve intent:', err);
            setIsLoading(false);
            setError(err instanceof Error ? err.message : 'Failed to approve');
        }
    };

    const handleReject = async () => {
        try {
            await onReject('User declined');
        } catch (err) {
            log.error('Failed to reject intent:', err);
        }
    };

    if (!isOpen) return null;

    if (showSuccess) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-lg max-w-md w-full p-8 text-center text-white">
                    <div className="flex justify-center mb-4">
                        <div className="bg-white rounded-full p-4">
                            <svg
                                className="w-16 h-16 text-green-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                    </div>
                    <h2 className="text-3xl font-bold mb-2">Success!</h2>
                    <p className="text-green-50 text-lg">Intent approved</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
                <Card>
                    <div className="space-y-6">
                        {/* Header */}
                        <div className="text-center">
                            <div className="mx-auto w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-3">
                                <svg
                                    className="w-6 h-6 text-indigo-600"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M13 10V3L4 14h7v7l9-11h-7z"
                                    />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Intent Request</h3>
                            <p className="text-sm text-gray-500 mt-1">
                                Type: <span className="font-medium">{event.type}</span>
                            </p>
                        </div>

                        {/* Wallet Info */}
                        {currentWallet && <WalletPreview wallet={currentWallet} isCompact />}

                        {/* Intent details */}
                        <IntentEventDetails event={event} />

                        {/* Error */}
                        {error && <div className="text-red-600 text-sm text-center p-2 bg-red-50 rounded">{error}</div>}

                        {/* Actions */}
                        <div className="flex gap-3">
                            <Button variant="secondary" onClick={handleReject} className="flex-1" disabled={isLoading}>
                                Reject
                            </Button>
                            {holdToSign ? (
                                <HoldToSignButton
                                    onComplete={handleApprove}
                                    disabled={isLoading}
                                    isLoading={isLoading}
                                    className="flex-1"
                                />
                            ) : (
                                <Button onClick={handleApprove} className="flex-1" disabled={isLoading}>
                                    {isLoading ? 'Approving...' : 'Approve'}
                                </Button>
                            )}
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

// ==================== Batched Intent Modal ====================

interface BatchedIntentRequestModalProps {
    batch: BatchedIntentEvent;
    savedWallets: SavedWallet[];
    isOpen: boolean;
    onApprove: () => Promise<void>;
    onReject: (reason?: string) => Promise<void>;
}

export const BatchedIntentRequestModal: React.FC<BatchedIntentRequestModalProps> = ({
    batch,
    savedWallets,
    isOpen,
    onApprove,
    onReject,
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { holdToSign } = useAuth();

    const currentWallet = useMemo(() => {
        return savedWallets[0] || null;
    }, [savedWallets]);

    useEffect(() => {
        if (!isOpen) {
            setShowSuccess(false);
            setIsLoading(false);
            setError(null);
        }
    }, [isOpen]);

    const handleApprove = async () => {
        setIsLoading(true);
        setError(null);
        try {
            await onApprove();
            setIsLoading(false);
            setShowSuccess(true);
        } catch (err) {
            log.error('Failed to approve batched intent:', err);
            setIsLoading(false);
            setError(err instanceof Error ? err.message : 'Failed to approve');
        }
    };

    const handleReject = async () => {
        try {
            await onReject('User declined');
        } catch (err) {
            log.error('Failed to reject batched intent:', err);
        }
    };

    // Filter out connect intents for display (they're auto-handled)
    const displayIntents = useMemo(() => {
        return batch.intents.filter((i) => i.type !== 'connect');
    }, [batch.intents]);

    const connectIntents = useMemo(() => {
        return batch.intents.filter((i) => i.type === 'connect');
    }, [batch.intents]);

    if (!isOpen) return null;

    if (showSuccess) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-lg max-w-md w-full p-8 text-center text-white">
                    <div className="flex justify-center mb-4">
                        <div className="bg-white rounded-full p-4">
                            <svg
                                className="w-16 h-16 text-green-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                    </div>
                    <h2 className="text-3xl font-bold mb-2">Success!</h2>
                    <p className="text-green-50 text-lg">Batched intent approved</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
                <Card>
                    <div className="space-y-6">
                        {/* Header */}
                        <div className="text-center">
                            <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-3">
                                <svg
                                    className="w-6 h-6 text-orange-600"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                                    />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Batched Intent Request</h3>
                            <p className="text-sm text-gray-500 mt-1">
                                Origin: <span className="font-medium">{batch.origin}</span>
                                {' · '}
                                {batch.intents.length} intent{batch.intents.length !== 1 ? 's' : ''}
                            </p>
                        </div>

                        {/* Wallet Info */}
                        {currentWallet && <WalletPreview wallet={currentWallet} isCompact />}

                        {/* Connect info if present */}
                        {connectIntents.length > 0 && (
                            <div className="border rounded-lg p-3 bg-yellow-50">
                                <p className="text-xs font-semibold text-yellow-800 mb-1">
                                    Includes {connectIntents.length} connect request
                                    {connectIntents.length > 1 ? 's' : ''}
                                </p>
                                <p className="text-xs text-yellow-700">
                                    A dApp connection will be established on approval.
                                </p>
                            </div>
                        )}

                        {/* Each intent */}
                        <div className="space-y-4">
                            {displayIntents.map((intent, i) => (
                                <div key={i} className="border rounded-lg p-3 bg-gray-50">
                                    <p className="text-xs text-gray-500 mb-2">Intent {i + 1}</p>
                                    <IntentEventDetails event={intent} />
                                </div>
                            ))}
                        </div>

                        {/* Error */}
                        {error && <div className="text-red-600 text-sm text-center p-2 bg-red-50 rounded">{error}</div>}

                        {/* Actions */}
                        <div className="flex gap-3">
                            <Button variant="secondary" onClick={handleReject} className="flex-1" disabled={isLoading}>
                                Reject
                            </Button>
                            {holdToSign ? (
                                <HoldToSignButton
                                    onComplete={handleApprove}
                                    disabled={isLoading}
                                    isLoading={isLoading}
                                    className="flex-1"
                                />
                            ) : (
                                <Button onClick={handleApprove} className="flex-1" disabled={isLoading}>
                                    {isLoading ? 'Approving...' : 'Approve'}
                                </Button>
                            )}
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};
