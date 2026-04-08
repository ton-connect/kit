/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { useMemo, useState, useEffect } from 'react';
import type { SignMessageRequestEvent } from '@ton/walletkit';
import type { SavedWallet } from '@demo/wallet-core';
import { useAuth, useSignMessageRequests } from '@demo/wallet-core';
import { toast } from 'sonner';

import { Button } from './Button';
import { Card } from './Card';
import { DAppInfo } from './DAppInfo';
import { WalletPreview } from './WalletPreview';
import { HoldToSignButton } from './HoldToSignButton';
import { createComponentLogger } from '../utils/logger';

const log = createComponentLogger('SignMessageRequestModal');

interface SignMessageRequestModalProps {
    request: SignMessageRequestEvent;
    savedWallets: SavedWallet[];
    isOpen: boolean;
}

export const SignMessageRequestModal: React.FC<SignMessageRequestModalProps> = ({ request, savedWallets, isOpen }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const { holdToSign } = useAuth();
    const { approveSignMessageRequest, rejectSignMessageRequest } = useSignMessageRequests();

    const currentWallet = useMemo(() => {
        if (!request.walletAddress) return null;
        return savedWallets.find((wallet) => wallet.kitWalletId === request.walletId) || null;
    }, [savedWallets, request.walletAddress, request.walletId]);

    useEffect(() => {
        if (!isOpen) {
            setShowSuccess(false);
            setIsLoading(false);
        }
    }, [isOpen]);

    const handleApprove = async () => {
        setIsLoading(true);
        try {
            await approveSignMessageRequest();
            setIsLoading(false);
            setShowSuccess(true);
        } catch (error) {
            log.error('Failed to approve sign message request:', error);
            toast.error('Failed to approve sign message', {
                description: (error as Error)?.message,
            });
            setIsLoading(false);
        }
    };

    const handleReject = () => {
        rejectSignMessageRequest('User rejected the sign message request');
    };

    if (!isOpen) return null;

    if (showSuccess) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <style>{`
                    @keyframes scale-in {
                        from { transform: scale(0.8); opacity: 0; }
                        to { transform: scale(1); opacity: 1; }
                    }
                    .success-card { animation: scale-in 0.3s ease-out; }
                `}</style>
                <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-lg max-w-md w-full p-8 relative overflow-hidden success-card">
                    <div className="relative z-10 text-center text-white space-y-6">
                        <div className="flex justify-center">
                            <div className="bg-white rounded-full p-4">
                                <svg
                                    className="w-16 h-16 text-green-500"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={3}
                                        d="M5 13l4 4L19 7"
                                    />
                                </svg>
                            </div>
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold mb-2">Success!</h2>
                            <p className="text-green-50 text-lg">Message signed successfully</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const messageCount = request.request?.messages?.length ?? request.request?.items?.length ?? 0;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
                <Card>
                    <div className="space-y-6">
                        <div className="text-center">
                            <h2 data-testid="request" className="text-xl font-bold text-gray-900">
                                Sign Message Request
                            </h2>
                            <p className="text-gray-600 text-sm mt-1">
                                A dApp wants you to sign a transaction without broadcasting it
                            </p>
                        </div>

                        <DAppInfo
                            iconUrl={request.dAppInfo?.iconUrl}
                            name={request.dAppInfo?.name}
                            url={request.dAppInfo?.url}
                            description={request.dAppInfo?.description}
                        />

                        {currentWallet && (
                            <div>
                                <WalletPreview wallet={currentWallet} isActive={true} isCompact={true} />
                            </div>
                        )}

                        <div className="border rounded-lg p-3 bg-blue-50">
                            <h4 className="font-medium text-blue-900 mb-2">Transaction Details</h4>
                            <p className="text-sm text-blue-800">
                                {messageCount} message{messageCount !== 1 ? 's' : ''} to sign (not broadcast)
                            </p>
                        </div>

                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path
                                            fillRule="evenodd"
                                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-yellow-800">
                                        <strong>Warning:</strong> This will sign a transaction that the dApp can submit
                                        later. Only approve if you trust the requesting dApp.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex space-x-3">
                            <Button
                                data-testid="sign-message-reject"
                                variant="secondary"
                                onClick={handleReject}
                                disabled={isLoading}
                                className="flex-1"
                            >
                                Reject
                            </Button>
                            {holdToSign ? (
                                <HoldToSignButton
                                    onComplete={handleApprove}
                                    isLoading={isLoading}
                                    disabled={isLoading}
                                    holdDuration={3000}
                                />
                            ) : (
                                <Button
                                    data-testid="sign-message-approve"
                                    onClick={handleApprove}
                                    isLoading={isLoading}
                                    disabled={isLoading}
                                    className="flex-1"
                                >
                                    Sign Message
                                </Button>
                            )}
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};
