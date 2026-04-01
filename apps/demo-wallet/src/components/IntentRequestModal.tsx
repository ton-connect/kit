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
    TransactionRequestMessage,
} from '@ton/walletkit';
import { useAuth } from '@demo/wallet-core';
import type { SavedWallet } from '@demo/wallet-core';

import { Button } from './Button';
import { Card } from './Card';
import { HoldToSignButton } from './HoldToSignButton';
import { WalletPreview } from './WalletPreview';
import { JettonFlow } from './TransactionRequestModal';
import { createComponentLogger } from '../utils/logger';

const log = createComponentLogger('IntentRequestModal');


const IntentEventDetails: React.FC<{ event: IntentRequestEvent }> = ({ event }) => {
    switch (event.type) {
        case 'transaction': {
            const tx = event as TransactionIntentRequestEvent;
            if (tx.deliveryMode === 'send') {
                return (
                    <div className="space-y-3">
                        {tx.validUntil && (
                            <p className="text-xs text-gray-500">
                                Valid until: {new Date(tx.validUntil * 1000).toLocaleString()}
                            </p>
                        )}
                        <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Money Flow:</p>
                            <JettonFlow transfers={tx.preview?.moneyFlow?.ourTransfers ?? []} />
                        </div>
                        <p className="text-xs text-red-600 bg-red-50 rounded p-2">
                            Warning: This transaction will be irreversible. Only approve if you trust the requesting
                            dApp and understand the transaction details.
                        </p>
                    </div>
                );
            }
            // signOnly — render like SignMessageRequestModal using resolvedTransaction.messages
            const messages = tx.resolvedTransaction?.messages ?? [];
            return (
                <div className="border rounded-lg p-3 bg-gray-50">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                        {messages.length} message{messages.length !== 1 ? 's' : ''} to sign
                    </p>
                    {messages.map((msg: TransactionRequestMessage, i: number) => (
                        <div key={i} className="mt-2 text-xs text-gray-500 space-y-0.5">
                            <p className="font-mono break-all">{msg.address}</p>
                            <p>{(BigInt(msg.amount) / 1_000_000_000n).toString()} TON</p>
                        </div>
                    ))}
                </div>
            );
        }
        case 'signData': {
            const sd = event as SignDataIntentRequestEvent;
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
            const action = event as ActionIntentRequestEvent;
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

// ==================== Header ====================

const IntentRequestHeader: React.FC<{ event: IntentRequestEvent }> = ({ event }) => {
    if (event.type === 'transaction') {
        const tx = event as TransactionIntentRequestEvent;
        if (tx.deliveryMode === 'signOnly') {
            return (
                <div className="text-center">
                    <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                        <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                            />
                        </svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Sign Message Request</h3>
                    <p className="text-sm text-gray-500 mt-1">Sign only — not broadcast to the network</p>
                </div>
            );
        }
        return (
            <div className="text-center">
                <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                    </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900">Transaction Request</h3>
                <p className="text-sm text-gray-500 mt-1">A dApp wants to send a transaction from your wallet</p>
            </div>
        );
    }
    return (
        <div className="text-center">
            <div className="mx-auto w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900">Intent Request</h3>
            <p className="text-sm text-gray-500 mt-1">
                Type: <span className="font-medium">{event.type}</span>
            </p>
        </div>
    );
};

// ==================== Single Intent Modal ====================

interface IntentRequestModalProps {
    event: IntentRequestEvent;
    savedWallets: SavedWallet[];
    activeWalletId?: string;
    isOpen: boolean;
    onApprove: () => Promise<void>;
    onReject: (reason?: string) => Promise<void>;
}

export const IntentRequestModal: React.FC<IntentRequestModalProps> = ({
    event,
    savedWallets,
    activeWalletId,
    isOpen,
    onApprove,
    onReject,
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { holdToSign } = useAuth();

    const currentWallet = useMemo(() => {
        return savedWallets.find((w) => w.kitWalletId === activeWalletId) ?? savedWallets[0] ?? null;
    }, [savedWallets, activeWalletId]);

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
                        <IntentRequestHeader event={event} />

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
                                    {isLoading
                                        ? event.type === 'transaction' &&
                                          (event as TransactionIntentRequestEvent).deliveryMode === 'signOnly'
                                            ? 'Signing...'
                                            : 'Approving...'
                                        : event.type === 'transaction' &&
                                            (event as TransactionIntentRequestEvent).deliveryMode === 'signOnly'
                                          ? 'Sign'
                                          : 'Approve'}
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
    activeWalletId?: string;
    isOpen: boolean;
    onApprove: () => Promise<void>;
    onReject: (reason?: string) => Promise<void>;
}

export const BatchedIntentRequestModal: React.FC<BatchedIntentRequestModalProps> = ({
    batch,
    savedWallets,
    activeWalletId,
    isOpen,
    onApprove,
    onReject,
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { holdToSign } = useAuth();

    const currentWallet = useMemo(() => {
        return savedWallets.find((w) => w.kitWalletId === activeWalletId) ?? savedWallets[0] ?? null;
    }, [savedWallets, activeWalletId]);

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
