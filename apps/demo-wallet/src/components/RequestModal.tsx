/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { useEffect, useMemo, useState } from 'react';
import type { SendTransactionRequestEvent, SignMessageRequestEvent, TransactionEmulatedPreview } from '@ton/walletkit';
import { useAuth, useWalletKit, useWalletStore } from '@demo/wallet-core';
import type { SavedWallet } from '@demo/wallet-core';
import { toast } from 'sonner';

import { Button } from './Button';
import { HoldToSignButton } from './HoldToSignButton';
import { JettonFlow } from './JettonFlow';
import { SuccessCard } from './SuccessCard';
import { createComponentLogger } from '../utils/logger';

type RequestEvent = SendTransactionRequestEvent | SignMessageRequestEvent;
type WarningTone = 'red' | 'yellow';

interface RequestModalProps {
    request: RequestEvent;
    savedWallets: SavedWallet[];
    isOpen: boolean;
    title: string;
    subtitle: string;
    details?: React.ReactNode;
    warning: { tone: WarningTone; message: React.ReactNode };
    approveLabel: string;
    successMessage: string;
    testIds: { request: string; approve: string; reject: string };
    onApprove: () => Promise<void>;
    onReject: () => void;
    loggerName: string;
    previewMode: 'send' | 'sign';
}

const WARNING_CLASSES: Record<WarningTone, { container: string; icon: string; text: string }> = {
    red: {
        container: 'bg-red-50 border-red-200',
        icon: 'text-red-400',
        text: 'text-red-800',
    },
    yellow: {
        container: 'bg-yellow-50 border-yellow-200',
        icon: 'text-yellow-400',
        text: 'text-yellow-800',
    },
};

export const RequestModal: React.FC<RequestModalProps> = ({
    request,
    savedWallets,
    isOpen,
    title,
    subtitle,
    details,
    warning,
    approveLabel,
    successMessage,
    testIds,
    onApprove,
    onReject,
    loggerName,
    previewMode,
}) => {
    const walletKit = useWalletKit();
    const isAuthenticated = useWalletStore((state) => state.walletManagement.isAuthenticated);
    const { holdToSign } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [isExpired, setIsExpired] = useState(false);
    const [localPreview, setLocalPreview] = useState<TransactionEmulatedPreview | undefined>(undefined);

    const log = useMemo(() => createComponentLogger(loggerName), [loggerName]);

    const currentWallet = useMemo(() => {
        if (!request.walletAddress) return null;
        return savedWallets.find((wallet) => wallet.kitWalletId === request.walletId) || null;
    }, [savedWallets, request.walletAddress, request.walletId]);

    useEffect(() => {
        const checkExpiration = () => {
            const validUntil = request.request?.validUntil;
            if (validUntil) {
                const now = Math.floor(Date.now() / 1000);
                setIsExpired(validUntil < now);
            } else {
                setIsExpired(false);
            }
        };
        checkExpiration();
        const interval = setInterval(checkExpiration, 1000);
        return () => clearInterval(interval);
    }, [request.request?.validUntil]);

    useEffect(() => {
        if (!isAuthenticated) return;
        async function updatePreview() {
            if (request.preview.data) return;
            await walletKit?.ensureInitialized();
            const preview = await walletKit
                ?.getWallet(request.walletId ?? '')
                ?.getTransactionPreview(request.request, { mode: previewMode });
            setLocalPreview(preview);
        }
        updatePreview();
    }, [request.walletId, request.request, request.preview, walletKit, isAuthenticated, previewMode]);

    const preview = useMemo(() => localPreview ?? request.preview.data, [request, localPreview]);

    useEffect(() => {
        if (!isOpen) {
            setShowSuccess(false);
            setIsLoading(false);
            setIsExpired(false);
        }
    }, [isOpen]);

    const handleApprove = async () => {
        setIsLoading(true);
        try {
            await onApprove();
            setShowSuccess(true);
        } catch (error) {
            log.error(`Failed to approve ${loggerName}:`, error);
            toast.error('Failed to approve request', {
                description: (error as Error)?.message,
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;
    if (showSuccess) return <SuccessCard message={successMessage} />;

    const warningClasses = WARNING_CLASSES[warning.tone];

    let dAppHost: string | undefined;
    try {
        dAppHost = request.dAppInfo?.url ? new URL(request.dAppInfo.url).host : undefined;
    } catch (_e) {
        dAppHost = request.dAppInfo?.url;
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center sm:p-4 z-50">
            <div className="bg-white w-full h-full sm:rounded-lg sm:max-w-md sm:h-auto sm:max-h-[90vh] flex flex-col overflow-hidden">
                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="space-y-6">
                        <div className="text-center">
                            <h2 data-testid={testIds.request} className="text-xl font-bold text-gray-900">
                                {title}
                            </h2>
                            <p className="text-gray-600 text-sm mt-1">{subtitle}</p>
                        </div>

                        {/* Combined dApp + Wallet block */}
                        <div className="border rounded-lg bg-gray-50 overflow-hidden">
                            {/* dApp row */}
                            <div className="flex items-center space-x-3 p-4">
                                {request.dAppInfo?.iconUrl ? (
                                    <img
                                        src={request.dAppInfo.iconUrl}
                                        alt={request.dAppInfo.name}
                                        className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                        }}
                                    />
                                ) : (
                                    <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                                        <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path
                                                fillRule="evenodd"
                                                d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 truncate">
                                        {request.dAppInfo?.name || 'Unknown dApp'}
                                    </p>
                                    {dAppHost && <p className="text-xs text-gray-500 truncate">{dAppHost}</p>}
                                </div>
                            </div>

                            {/* Wallet row */}
                            {currentWallet && (
                                <>
                                    <div className="border-t border-gray-200" />
                                    <div className="flex items-center space-x-3 p-4">
                                        <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center flex-shrink-0">
                                            <svg
                                                className="w-5 h-5"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                                                />
                                            </svg>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                {currentWallet.name}
                                            </p>
                                            <p className="text-xs text-gray-500 font-mono truncate">
                                                {currentWallet.address.slice(0, 6)}...{currentWallet.address.slice(-6)}
                                            </p>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {isExpired ? (
                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg
                                            className="h-6 w-6 text-orange-500"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-orange-800">Transaction Expired</h3>
                                        <p className="text-sm text-orange-700 mt-1">
                                            This transaction request has expired and can no longer be signed. Please
                                            reject it and request a new transaction from the dApp.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <>
                                {details}

                                {preview && preview.result === 'success' && (
                                    <div>
                                        <div className="space-y-3">
                                            {preview.moneyFlow?.outputs === '0' &&
                                            preview.moneyFlow?.inputs === '0' &&
                                            preview.moneyFlow?.ourTransfers.length === 0 ? (
                                                <div className="border rounded-lg p-3 bg-gray-50">
                                                    <p className="text-sm text-gray-600 text-center">
                                                        This transaction doesn&apos;t involve any token transfers
                                                    </p>
                                                </div>
                                            ) : (
                                                <JettonFlow transfers={preview.moneyFlow?.ourTransfers || []} />
                                            )}
                                        </div>
                                    </div>
                                )}

                                {preview && (preview.result === 'failure' || preview.error) && (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                        <p className="text-sm text-red-800">
                                            <strong>Error:</strong> {preview.error?.message}
                                        </p>
                                    </div>
                                )}

                                <div className={`border rounded-lg p-3 ${warningClasses.container}`}>
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <svg
                                                className={`h-5 w-5 ${warningClasses.icon}`}
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
                                            <p className={`text-sm ${warningClasses.text}`}>{warning.message}</p>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Action buttons — always visible at bottom */}
                <div className="flex space-x-3 p-4 border-t border-gray-200 bg-white">
                    <Button
                        variant="secondary"
                        onClick={onReject}
                        disabled={isLoading}
                        className={isExpired ? 'w-full' : 'flex-1'}
                        data-testid={testIds.reject}
                    >
                        Reject
                    </Button>
                    {!isExpired &&
                        (holdToSign ? (
                            <HoldToSignButton
                                onComplete={handleApprove}
                                isLoading={isLoading}
                                disabled={isLoading}
                                holdDuration={3000}
                            />
                        ) : (
                            <Button
                                onClick={handleApprove}
                                isLoading={isLoading}
                                disabled={isLoading}
                                className="flex-1"
                                data-testid={testIds.approve}
                            >
                                {approveLabel}
                            </Button>
                        ))}
                </div>
            </div>
        </div>
    );
};
