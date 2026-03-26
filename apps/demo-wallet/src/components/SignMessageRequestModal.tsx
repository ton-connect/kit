/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { useEffect, useMemo, useState } from 'react';
import type { SignMessageRequestEvent } from '@ton/walletkit';
import { useAuth, useSignMessageRequests } from '@demo/wallet-core';
import type { SavedWallet } from '@demo/wallet-core';

import { Button } from './Button';
import { Card } from './Card';
import { HoldToSignButton } from './HoldToSignButton';
import { WalletPreview } from './WalletPreview';
import { createComponentLogger } from '../utils/logger';

const log = createComponentLogger('SignMessageRequestModal');

interface SignMessageRequestModalProps {
    request: SignMessageRequestEvent;
    savedWallets: SavedWallet[];
    isOpen: boolean;
}

export const SignMessageRequestModal: React.FC<SignMessageRequestModalProps> = ({ request, savedWallets, isOpen }) => {
    const { approveSignMessageRequest, rejectSignMessageRequest } = useSignMessageRequests();
    const { holdToSign } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const currentWallet = useMemo(() => {
        return savedWallets.find((w) => w.kitWalletId === request.walletId) ?? savedWallets[0] ?? null;
    }, [savedWallets, request.walletId]);

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
            setIsLoading(false);
        }
    };

    const handleReject = () => {
        rejectSignMessageRequest();
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
                    <p className="text-green-50 text-lg">Message signed successfully</p>
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
                            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                                <svg
                                    className="w-6 h-6 text-green-600"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
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

                        {/* Wallet Info */}
                        {currentWallet && <WalletPreview wallet={currentWallet} isCompact />}

                        {/* Messages */}
                        <div className="border rounded-lg p-3 bg-gray-50">
                            <p className="text-sm font-medium text-gray-700 mb-2">
                                {request.request.messages.length} message{request.request.messages.length !== 1 ? 's' : ''} to sign
                            </p>
                            {request.request.messages.map((msg, i) => (
                                <div key={i} className="mt-2 text-xs text-gray-500">
                                    <span className="font-mono">{msg.address}</span>
                                    <span className="ml-2">{(BigInt(msg.amount) / 1_000_000_000n).toString()} TON</span>
                                </div>
                            ))}
                        </div>

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
                                    {isLoading ? 'Signing...' : 'Sign'}
                                </Button>
                            )}
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};
