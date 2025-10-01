import React, { useEffect, useState } from 'react';
import type { EventSignDataRequest, SessionInfo } from '@ton/walletkit';

import { Button } from './Button';
import { Card } from './Card';
import { DAppInfo } from './DAppInfo';
import { createComponentLogger } from '../utils/logger';
import { useWalletKit } from '../stores';

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

    const walletKit = useWalletKit();
    const [sessionFrom, setSessionFrom] = useState<SessionInfo | undefined>(undefined);
    useEffect(() => {
        async function fetchSessionFrom() {
            if (!walletKit) return;
            const sessions = await walletKit.listSessions();
            const session = sessions.find((session) => session.sessionId === request.from);
            setSessionFrom(session);
        }
        fetchSessionFrom();
    }, [request.from, walletKit]);
    // const sessionFrom = useMemo(() => {
    //     const sessions = await walletKit.listSessions()
    //     return request.from;
    // }, [request.from]);

    if (!isOpen) return null;

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
                            iconUrl={sessionFrom?.dAppIconUrl}
                            name={sessionFrom?.dAppName}
                            url={sessionFrom?.dAppUrl}
                        />

                        {/* Request Information */}

                        {/* Wallet Address */}
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-md text-gray-600">Wallet:</span>
                            <span className="text-md font-mono text-black">
                                {formatAddress(request.walletAddress ?? '')}
                            </span>
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
                            <Button
                                data-test-id="sign-data-reject"
                                variant="secondary"
                                onClick={handleReject}
                                disabled={isLoading}
                                className="flex-1"
                            >
                                Reject
                            </Button>
                            <Button
                                data-test-id="sign-data-approve"
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
