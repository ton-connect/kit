import React, { useState } from 'react';
import type { EventSignDataRequest } from '@ton/walletkit';

import { Button } from './Button';
import { Card } from './Card';
import { createComponentLogger } from '../utils/logger';

// Create logger for sign data request modal
const log = createComponentLogger('SignDataRequestModal');

interface SignDataRequestModalProps {
    request: EventSignDataRequest;
    isOpen: boolean;
    onApprove: () => void;
    onReject: (reason?: string) => void;
}

export const SignDataRequestModal: React.FC<SignDataRequestModalProps> = ({ request, isOpen, onApprove, onReject }) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleApprove = async () => {
        setIsLoading(true);
        try {
            await onApprove();
        } catch (error) {
            log.error('Failed to approve sign data request:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleReject = () => {
        onReject('User rejected the sign data request');
    };

    const formatAddress = (address: string): string => {
        if (!address) return '';
        return `${address.slice(0, 8)}...${address.slice(-8)}`;
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
                    <div className="border rounded-lg p-3 bg-purple-50">
                        <h4 className="font-medium text-purple-900 mb-2">TON Cell Data</h4>
                        <div className="space-y-2">
                            <p className="text-sm text-purple-800">Content: {preview.content}</p>
                            {preview.schema && <p className="text-sm text-purple-800">Schema: {preview.schema}</p>}
                            {preview.parsed && (
                                <div>
                                    <p className="text-sm text-purple-800 mb-1">Parsed Data:</p>
                                    <pre className="text-xs text-purple-700 overflow-x-auto whitespace-pre-wrap">
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
                        <h4 className="font-medium text-gray-900 mb-2">Data to Sign</h4>
                        <p className="text-sm text-gray-600">Unknown data format</p>
                    </div>
                );
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
                <Card>
                    <div className="space-y-6">
                        {/* Header */}
                        <div className="text-center">
                            <h2 className="text-xl font-bold text-gray-900">Sign Data Request</h2>
                            <p className="text-gray-600 text-sm mt-1">A dApp wants you to sign data with your wallet</p>
                        </div>

                        {/* Request Information */}
                        <div className="border rounded-lg p-4 bg-gray-50">
                            <h3 className="font-semibold text-gray-900 mb-3">Request Details</h3>

                            {/* From Address */}
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-gray-600">From:</span>
                                <span className="text-sm font-mono text-black">{formatAddress(request.from)}</span>
                            </div>

                            {/* Wallet Address */}
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-gray-600">Wallet:</span>
                                <span className="text-sm font-mono text-black">
                                    {formatAddress(request.wallet.getAddress())}
                                </span>
                            </div>

                            {/* Request ID */}
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Request ID:</span>
                                <span className="text-sm font-mono text-black text-xs">
                                    {request.id.slice(0, 8)}...
                                </span>
                            </div>
                        </div>

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
                            <Button variant="secondary" onClick={handleReject} disabled={isLoading} className="flex-1">
                                Reject
                            </Button>
                            <Button
                                onClick={handleApprove}
                                isLoading={isLoading}
                                disabled={isLoading}
                                className="flex-1"
                            >
                                Sign Data
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};
