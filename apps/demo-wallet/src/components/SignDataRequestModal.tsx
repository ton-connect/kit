import React, { useMemo, useState, useEffect } from 'react';
import type { EventSignDataRequest } from '@ton/walletkit';

import { Button } from './Button';
import { Card } from './Card';
import { DAppInfo } from './DAppInfo';
import { WalletPreview } from './WalletPreview';
import { HoldToSignButton } from './HoldToSignButton';
import type { SavedWallet } from '../types/wallet';
import { createComponentLogger } from '../utils/logger';
import { useAuth } from '../stores';

// Create logger for sign data request modal
const log = createComponentLogger('SignDataRequestModal');

interface SignDataRequestModalProps {
    request: EventSignDataRequest;
    savedWallets: SavedWallet[];
    isOpen: boolean;
    onApprove: () => void;
    onReject: (reason?: string) => void;
}

export const SignDataRequestModal: React.FC<SignDataRequestModalProps> = ({
    request,
    savedWallets,
    isOpen,
    onApprove,
    onReject,
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const { holdToSign } = useAuth();

    // Find the wallet being used for this sign data request
    const currentWallet = useMemo(() => {
        if (!request.walletAddress) return null;
        return savedWallets.find((wallet) => wallet.address === request.walletAddress) || null;
    }, [savedWallets, request.walletAddress]);

    // Reset success state when modal closes/opens
    useEffect(() => {
        if (!isOpen) {
            setShowSuccess(false);
            setIsLoading(false);
        }
    }, [isOpen]);

    const handleApprove = async () => {
        setIsLoading(true);
        try {
            // First, perform the actual signing operation
            await onApprove();

            // If successful, show success animation
            setIsLoading(false);
            setShowSuccess(true);

            // The parent will handle closing the modal after it sees the request is completed
            // But we keep showing the success state for visual feedback
        } catch (error) {
            log.error('Failed to approve sign data request:', error);
            setIsLoading(false);
        }
    };

    const handleReject = () => {
        onReject('User rejected the sign data request');
    };

    const renderDataPreview = () => {
        const { preview } = request;

        switch (preview.kind) {
            case 'text':
                return (
                    <div className="border rounded-lg p-3 bg-blue-50">
                        <h4 className="font-medium text-blue-900 mb-2">Text Message</h4>
                        <p className="text-sm text-blue-800 break-words">{preview.content}</p>
                    </div>
                );
            case 'binary':
                return (
                    <div className="border rounded-lg p-3 bg-green-50">
                        <h4 className="font-medium text-green-900 mb-2">Binary Data</h4>
                        <div className="space-y-2">
                            <p className="text-sm text-green-800">Content: {preview.content}</p>
                        </div>
                    </div>
                );
            case 'cell':
                return (
                    <div className="">
                        {/* <h4 className="font-medium mb-2">TON Cell Data</h4> */}
                        <div className="space-y-2">
                            <div>
                                <p className="font-medium">Content</p>
                                <p className="text-gray-600 text-sm overflow-x-auto whitespace-pre-wrap">
                                    {preview.content}
                                </p>
                            </div>
                            {preview.schema && (
                                <div>
                                    <p className="font-medium">Schema</p>
                                    <p className="text-gray-600 text-sm overflow-x-auto whitespace-pre-wrap">
                                        {preview.schema}
                                    </p>
                                </div>
                            )}
                            {/* <p className="text-sm overflow-x-auto whitespace-pre-wrap">Content: {preview.content}</p> */}
                            {/* {preview.schema && <p className="text-sm">Schema: {preview.schema}</p>} */}
                            {preview.parsed && (
                                <div>
                                    <p className="font-medium mb-1">Parsed Data:</p>
                                    <pre className="text-xs overflow-x-auto whitespace-pre-wrap bg-gray-100 p-2 rounded-lg">
                                        {JSON.stringify(preview.parsed, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                    </div>
                );
            default:
                return (
                    <div className="border rounded-lg p-3 bg-gray-50">
                        {/* <h4 className="font-medium text-gray-900 mb-2">Data to Sign</h4> */}
                        <p className="text-sm text-gray-600">Unknown data format</p>
                    </div>
                );
        }
    };

    if (!isOpen) return null;

    // Success state view
    if (showSuccess) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <style>{`
                    @keyframes scale-in {
                        from {
                            transform: scale(0.8);
                            opacity: 0;
                        }
                        to {
                            transform: scale(1);
                            opacity: 1;
                        }
                    }
                    .success-card {
                        animation: scale-in 0.3s ease-out;
                    }
                `}</style>
                <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-lg max-w-md w-full p-8 relative overflow-hidden success-card">
                    {/* Success Content */}
                    <div className="relative z-10 text-center text-white space-y-6">
                        {/* Success Icon */}
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

                        {/* Success Message */}
                        <div>
                            <h2 className="text-3xl font-bold mb-2">Success!</h2>
                            <p className="text-green-50 text-lg">Data signed successfully</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Normal request view
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
                <Card>
                    <div className="space-y-6">
                        {/* Header */}
                        <div className="text-center">
                            <h2 data-test-id="request" className="text-xl font-bold text-gray-900">
                                Sign Data Request
                            </h2>
                            <p className="text-gray-600 text-sm mt-1">A dApp wants you to sign data with your wallet</p>
                        </div>

                        {/* dApp Information */}
                        <DAppInfo
                            iconUrl={request.dAppInfo?.iconUrl}
                            name={request.dAppInfo?.name}
                            url={request.dAppInfo?.url}
                            description={request.dAppInfo?.description}
                        />

                        {/* Wallet Information */}
                        {currentWallet && (
                            <div>
                                <WalletPreview wallet={currentWallet} isActive={true} isCompact={true} />
                            </div>
                        )}

                        {/* Data Preview */}
                        <div>
                            <h4 className="font-medium text-gray-900 mb-3">Data to Sign</h4>
                            {renderDataPreview()}
                        </div>

                        {/* Warning */}
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
                                        <strong>Warning:</strong> Only sign data if you trust the requesting dApp and
                                        understand what you're signing. Signing data can have security implications.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex space-x-3">
                            <Button
                                data-test-id="sign-data-reject"
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
                                    data-test-id="sign-data-approve"
                                    onClick={handleApprove}
                                    isLoading={isLoading}
                                    disabled={isLoading}
                                    className="flex-1"
                                >
                                    Sign Data ('regular')
                                </Button>
                            )}
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};
