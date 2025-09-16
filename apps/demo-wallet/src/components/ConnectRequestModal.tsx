import React, { useState } from 'react';
import type { EventConnectRequest, WalletInterface } from '@ton/walletkit';

import { Button } from './Button';
import { Card } from './Card';
import { createComponentLogger } from '../utils/logger';

// Create logger for connect request modal
const log = createComponentLogger('ConnectRequestModal');

interface ConnectRequestModalProps {
    request: EventConnectRequest;
    availableWallets: WalletInterface[];
    isOpen: boolean;
    onApprove: (selectedWallet: WalletInterface) => void;
    onReject: (reason?: string) => void;
}

export const ConnectRequestModal: React.FC<ConnectRequestModalProps> = ({
    request,
    availableWallets,
    isOpen,
    onApprove,
    onReject,
}) => {
    const [selectedWallet, setSelectedWallet] = useState<WalletInterface | null>(availableWallets[0] || null);
    const [isLoading, setIsLoading] = useState(false);

    const handleApprove = async () => {
        if (!selectedWallet) return;

        setIsLoading(true);
        try {
            await onApprove(selectedWallet);
        } catch (error) {
            log.error('Failed to approve connection:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleReject = () => {
        onReject('User rejected the connection');
    };

    const formatAddress = (address: string): string => {
        if (!address) return '';
        return `${address.slice(0, 8)}...${address.slice(-8)}`;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
                <Card>
                    <div className="space-y-6">
                        {/* Header */}
                        <div className="text-center">
                            <h2 className="text-xl font-bold text-gray-900">Connect Request</h2>
                            <p className="text-gray-600 text-sm mt-1">A dApp wants to connect to your wallet</p>
                        </div>

                        {/* dApp Information */}
                        <div className="border rounded-lg p-4 bg-gray-50">
                            <div className="flex items-center space-x-4">
                                {/* dApp Icon */}
                                {request.preview.manifest?.iconUrl ? (
                                    <img
                                        src={request.preview.manifest.iconUrl}
                                        alt={request.preview?.manifest?.name}
                                        className="w-12 h-12 rounded-lg object-cover border"
                                        onError={(e) => {
                                            // Hide image if it fails to load
                                            e.currentTarget.style.display = 'none';
                                        }}
                                    />
                                ) : (
                                    <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center">
                                        <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path
                                                fillRule="evenodd"
                                                d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </div>
                                )}

                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-gray-900 truncate">
                                        {request.preview.manifest?.name}
                                    </h3>
                                    {request.preview.manifest?.description && (
                                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                            {request.preview.manifest.description}
                                        </p>
                                    )}
                                    {request.preview?.manifestUrl && (
                                        <p className="text-xs text-gray-500 mt-1 truncate">
                                            {new URL(request.preview.manifestUrl).hostname}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Requested Permissions */}
                        {(request.preview.permissions || []).length > 0 && (
                            <div>
                                <h4 className="font-medium text-gray-900 mb-3">Requested Permissions:</h4>
                                <div className="space-y-3">
                                    {request.preview.permissions?.map((permission, index) => (
                                        <div key={index} className="border rounded-lg p-3 bg-gray-50">
                                            <div className="flex items-start space-x-3">
                                                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                                                <div className="flex-1 min-w-0">
                                                    <h5 className="text-sm font-medium text-gray-900 mb-1">
                                                        {permission.title}
                                                    </h5>
                                                    <p className="text-xs text-gray-600 leading-relaxed">
                                                        {permission.description}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Wallet Selection */}
                        {availableWallets.length > 1 && (
                            <div>
                                <h4 className="font-medium text-gray-900 mb-3">Select Wallet:</h4>
                                <div className="space-y-2">
                                    {availableWallets.map((wallet, index) => (
                                        <label
                                            key={index}
                                            className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                                                selectedWallet === wallet
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="wallet"
                                                value={index}
                                                checked={selectedWallet === wallet}
                                                onChange={() => setSelectedWallet(wallet)}
                                                className="sr-only"
                                            />
                                            <div className="flex items-center space-x-3 flex-1">
                                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                                    <span className="text-white text-xs font-bold">{index + 1}</span>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">
                                                        Wallet {index + 1}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {formatAddress(wallet.getAddress())}
                                                    </p>
                                                </div>
                                            </div>
                                            {selectedWallet === wallet && (
                                                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                                    <svg
                                                        className="w-3 h-3 text-white"
                                                        fill="currentColor"
                                                        viewBox="0 0 20 20"
                                                    >
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                            clipRule="evenodd"
                                                        />
                                                    </svg>
                                                </div>
                                            )}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

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
                                        Only connect to trusted applications. This will give the dApp access to your
                                        wallet address and allow it to request transactions.
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
                                disabled={!selectedWallet || isLoading}
                                className="flex-1"
                            >
                                Connect
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};
