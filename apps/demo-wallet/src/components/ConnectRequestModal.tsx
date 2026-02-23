/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Network } from '@ton/walletkit';
import type { ConnectionRequestEvent, Wallet } from '@ton/walletkit';
import type { SavedWallet } from '@demo/wallet-core';
import { toast } from 'sonner';

import { Button } from './Button';
import { Card } from './Card';
import { DAppInfo } from './DAppInfo';
import { WalletPreview } from './WalletPreview';
import { createComponentLogger } from '../utils/logger';

const log = createComponentLogger('ConnectRequestModal');

interface ResolvedWalletInfo {
    id: string;
    address: string;
    isTestnet: boolean;
}

interface ConnectRequestModalProps {
    request: ConnectionRequestEvent;
    availableWallets: Wallet[];
    savedWallets: SavedWallet[];
    currentWallet?: Wallet;
    isOpen: boolean;
    onApprove: (selectedWallet: Wallet) => void;
    onReject: (reason?: string) => void;
}

export const ConnectRequestModal: React.FC<ConnectRequestModalProps> = ({
    request,
    availableWallets,
    savedWallets,
    currentWallet,
    isOpen,
    onApprove,
    onReject,
}) => {
    const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(currentWallet || null);
    const [isLoading, setIsLoading] = useState(false);
    const [showAllWallets, setShowAllWallets] = useState(false);
    const [walletInfos, setWalletInfos] = useState<ResolvedWalletInfo[]>([]);

    // Auto-select current wallet or first available wallet if selectedWallet is null
    useEffect(() => {
        if (selectedWallet !== null) return;

        const intervalId = setInterval(() => {
            const walletToSelect = currentWallet || availableWallets[0];
            if (walletToSelect) {
                setSelectedWallet(walletToSelect);
            }
        }, 100);

        return () => clearInterval(intervalId);
    }, [selectedWallet, availableWallets, currentWallet]);

    // Resolve async wallet info for all available wallets
    useEffect(() => {
        if (availableWallets.length === 0) return;
        let cancelled = false;
        Promise.all(
            availableWallets.map(async (wallet) => {
                const [id, address, network] = await Promise.all([
                    wallet.getWalletId(),
                    wallet.getAddress(),
                    wallet.getNetwork(),
                ]);
                return { id, address, isTestnet: network.chainId === Network.testnet().chainId };
            }),
        ).then((infos) => {
            if (!cancelled) setWalletInfos(infos);
        });
        return () => {
            cancelled = true;
        };
    }, [availableWallets]);

    const walletDataMap = useMemo(() => {
        const map = new Map<string, SavedWallet>();
        savedWallets.forEach((savedWallet) => {
            map.set(savedWallet.id, savedWallet);
        });
        return map;
    }, [savedWallets]);

    const selectedWalletIndex = selectedWallet ? availableWallets.indexOf(selectedWallet) : -1;
    const selectedWalletInfo = selectedWalletIndex >= 0 ? walletInfos[selectedWalletIndex] : null;

    const handleApprove = async () => {
        if (!selectedWallet) return;

        setIsLoading(true);
        try {
            await onApprove(selectedWallet);
        } catch (error) {
            log.error('Failed to approve connection:', error);
            toast.error('Failed to approve connection', {
                description: (error as Error)?.message,
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleReject = () => {
        onReject('User rejected the connection');
    };

    const formatAddress = (address: string, length: number = 16): string => {
        if (!address) return '';
        let halfLength = Math.floor(length / 2);
        if (halfLength > 24) {
            halfLength = 24;
        }
        let dots = '...';
        if (halfLength > 23) {
            dots = '';
        } else if (halfLength > 22) {
            dots = '.';
        }
        return `${address.slice(0, halfLength)}${dots}${address.slice(-halfLength)}`;
    };

    const selectedNetworkLabel = selectedWalletInfo
        ? { label: selectedWalletInfo.isTestnet ? 'Testnet' : 'Mainnet', isTestnet: selectedWalletInfo.isTestnet }
        : { label: 'Unknown', isTestnet: false };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
                <Card>
                    <div className="space-y-6">
                        {/* Header */}
                        <div className="text-center">
                            <h2 data-testid="request" className="text-xl font-bold text-gray-900">
                                Connect Request
                            </h2>
                            <p className="text-gray-600 text-sm mt-1">A dApp wants to connect to your wallet</p>
                            {selectedWallet && (
                                <span
                                    className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        selectedNetworkLabel.isTestnet
                                            ? 'bg-orange-100 text-orange-800'
                                            : 'bg-green-100 text-green-800'
                                    }`}
                                >
                                    {selectedNetworkLabel.label}
                                </span>
                            )}
                        </div>

                        {/* dApp Information */}
                        <DAppInfo
                            name={request.dAppInfo?.name}
                            description={request.dAppInfo?.description}
                            url={request.dAppInfo?.url}
                            iconUrl={request.dAppInfo?.iconUrl}
                        />

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
                                                    {permission.name === 'ton_addr' && selectedWalletInfo && (
                                                        <p className="text-xs text-gray-500 mt-1 truncate">
                                                            Your address:{' '}
                                                            {formatAddress(selectedWalletInfo.address, 20)}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Wallet Selection */}
                        {availableWallets.length > 0 && (
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-medium text-gray-900">
                                        {availableWallets.length > 1 ? 'Connecting with:' : 'Wallet:'}
                                    </h4>
                                    {availableWallets.length > 1 && !showAllWallets && (
                                        <button
                                            onClick={() => setShowAllWallets(true)}
                                            className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                                        >
                                            Change wallet
                                        </button>
                                    )}
                                </div>

                                {showAllWallets ? (
                                    <div className="space-y-2">
                                        {availableWallets.map((wallet, index) => {
                                            const info = walletInfos[index];
                                            const walletId = info?.id ?? String(index);
                                            const savedWallet = info ? walletDataMap.get(info.id) : undefined;
                                            const networkLabel = info?.isTestnet ? 'testnet' : 'mainnet';

                                            return (
                                                <label key={walletId} className="block cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="wallet"
                                                        value={walletId}
                                                        checked={selectedWalletIndex === index}
                                                        onChange={() => {
                                                            setSelectedWallet(wallet);
                                                            setShowAllWallets(false);
                                                        }}
                                                        className="sr-only"
                                                    />
                                                    <WalletPreview
                                                        wallet={
                                                            savedWallet || {
                                                                id: walletId,
                                                                name: `Wallet ${index + 1}`,
                                                                address: info?.address ?? '',
                                                                publicKey: '',
                                                                walletType: 'mnemonic',
                                                                walletInterfaceType: 'mnemonic',
                                                                network: networkLabel,
                                                                createdAt: Date.now(),
                                                            }
                                                        }
                                                        isActive={selectedWalletIndex === index}
                                                        isCompact={false}
                                                        onClick={() => {
                                                            setSelectedWallet(wallet);
                                                            setShowAllWallets(false);
                                                        }}
                                                    />
                                                </label>
                                            );
                                        })}
                                        <button
                                            onClick={() => setShowAllWallets(false)}
                                            className="w-full text-sm text-gray-600 hover:text-gray-700 py-2 text-center"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                ) : (
                                    selectedWallet &&
                                    selectedWalletInfo && (
                                        <div>
                                            <WalletPreview
                                                wallet={
                                                    walletDataMap.get(selectedWalletInfo.id) || {
                                                        id: selectedWalletInfo.id,
                                                        name: 'Selected Wallet',
                                                        address: selectedWalletInfo.address,
                                                        publicKey: '',
                                                        walletType: 'mnemonic',
                                                        walletInterfaceType: 'mnemonic',
                                                        network: selectedWalletInfo.isTestnet ? 'testnet' : 'mainnet',
                                                        createdAt: Date.now(),
                                                    }
                                                }
                                                isActive={true}
                                                isCompact={true}
                                            />
                                        </div>
                                    )
                                )}
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
                            <Button
                                data-testid="connect-reject"
                                variant="secondary"
                                onClick={handleReject}
                                disabled={isLoading}
                                className="flex-1"
                            >
                                Reject
                            </Button>
                            <Button
                                data-testid="connect-approve"
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
