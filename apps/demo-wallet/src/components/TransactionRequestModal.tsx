/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { memo, useEffect, useMemo, useState } from 'react';
import { Network } from '@ton/walletkit';
import type { JettonInfo, TransactionRequestEvent, TransactionTraceMoneyFlowItem } from '@ton/walletkit';
import { Address } from '@ton/core';
import { useWalletKit, useAuth, useWalletStore, useTransactionRequests } from '@demo/wallet-core';
import type { SavedWallet } from '@demo/wallet-core';
import { toast } from 'sonner';

import { Button } from './Button';
import { Card } from './Card';
import { DAppInfo } from './DAppInfo';
import { WalletPreview } from './WalletPreview';
import { HoldToSignButton } from './HoldToSignButton';
import { createComponentLogger } from '../utils/logger';
import { formatUnits } from '../utils/units';
// Create logger for transaction request modal

const log = createComponentLogger('TransactionRequestModal');

interface TransactionRequestModalProps {
    request: TransactionRequestEvent;
    savedWallets: SavedWallet[];
    isOpen: boolean;
}

export const TransactionRequestModal: React.FC<TransactionRequestModalProps> = ({ request, savedWallets, isOpen }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [isExpired, setIsExpired] = useState(false);
    const { holdToSign } = useAuth();
    const { approveTransactionRequest, rejectTransactionRequest } = useTransactionRequests();

    // Find the wallet being used for this transaction
    const currentWallet = useMemo(() => {
        if (!request.walletAddress) return null;
        return savedWallets.find((wallet) => wallet.kitWalletId === request.walletId) || null;
    }, [savedWallets, request.walletAddress]);

    // Check every second if transaction has expired
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

        // Check immediately
        checkExpiration();

        // Set up interval to check every second
        const interval = setInterval(checkExpiration, 1000);

        return () => clearInterval(interval);
    }, [request.request?.validUntil]);

    // Reset success state when modal closes/opens
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
            // First, perform the actual signing operation
            await approveTransactionRequest();

            // If successful, show success animation
            setIsLoading(false);
            setShowSuccess(true);

            // The parent will handle closing the modal after it sees the request is completed
            // But we keep showing the success state for visual feedback
        } catch (error) {
            log.error('Failed to approve transaction:', error);
            toast.error('Failed to approve transaction', {
                description: (error as Error)?.message,
            });
            setIsLoading(false);
        }
    };

    const handleReject = () => {
        rejectTransactionRequest('User rejected the transaction');
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
                            <p className="text-green-50 text-lg">Transaction signed successfully</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
                <Card>
                    <div className="space-y-6">
                        {/* Header */}
                        <div className="text-center">
                            <h2 data-testid="request" className="text-xl font-bold text-gray-900">
                                Transaction Request
                            </h2>
                            <p className="text-gray-600 text-sm mt-1">
                                A dApp wants to send a transaction from your wallet
                            </p>
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
                                {/* <h4 className="font-medium text-gray-900 mb-3">Signing with:</h4> */}
                                <WalletPreview wallet={currentWallet} isActive={true} isCompact={true} />
                            </div>
                        )}

                        {/* Expired Transaction Warning */}
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
                                {request.preview.data.result === 'success' && (
                                    <>
                                        {/* Money Flow Summary */}
                                        <div>
                                            <div className="space-y-3">
                                                {/* No transfers message */}
                                                {request.preview.data.moneyFlow?.outputs === '0' &&
                                                request.preview.data.moneyFlow.inputs === '0' &&
                                                request.preview.data.moneyFlow.ourTransfers.length === 0 ? (
                                                    <div className="border rounded-lg p-3 bg-gray-50">
                                                        <p className="text-sm text-gray-600 text-center">
                                                            This transaction doesn't involve any token transfers
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <JettonFlow
                                                        transfers={request.preview.data.moneyFlow?.ourTransfers || []}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                        {/* Parsed Actions from Emulation */}
                                        {/*{request.preview.data.result && (*/}
                                        {/*    <ActionPreviewList*/}
                                        {/*        emulationResult={request.preview.data.trace}*/}
                                        {/*        walletAddress={request.walletAddress || currentWallet?.address}*/}
                                        {/*        className="mt-4"*/}
                                        {/*        title="Actions:"*/}
                                        {/*    />*/}
                                        {/*)}*/}
                                    </>
                                )}

                                {(request.preview.data.result === 'failure' || request.preview.data.error) && (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                        <p className="text-sm text-red-800">
                                            <strong>Error:</strong> {request.preview.data.error?.message}
                                        </p>
                                    </div>
                                )}

                                {/* Warning */}
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <svg
                                                className="h-5 w-5 text-red-400"
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
                                            <p className="text-sm text-red-800">
                                                <strong>Warning:</strong> This transaction will be irreversible. Only
                                                approve if you trust the requesting dApp and understand the transaction
                                                details.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Action Buttons */}
                        <div className="flex space-x-3">
                            <Button
                                variant="secondary"
                                onClick={handleReject}
                                disabled={isLoading}
                                className={isExpired ? 'w-full' : 'flex-1'}
                                data-testid="send-transaction-reject"
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
                                        data-testid="send-transaction-approve"
                                    >
                                        Approve & Sign
                                    </Button>
                                ))}
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

function useActiveWalletNetwork(): 'mainnet' | 'testnet' {
    const savedWallets = useWalletStore((state) => state.walletManagement.savedWallets);
    const activeWalletId = useWalletStore((state) => state.walletManagement.activeWalletId);
    const activeWallet = savedWallets.find((w) => w.id === activeWalletId);
    return activeWallet?.network || 'testnet';
}

function useJettonInfo(jettonAddress: Address | string | null) {
    const walletKit = useWalletKit();
    const network = useActiveWalletNetwork();
    const [jettonInfo, setJettonInfo] = useState<JettonInfo | null>(null);
    const chainNetwork = network === 'mainnet' ? Network.mainnet() : Network.testnet();

    useEffect(() => {
        if (!jettonAddress) {
            setJettonInfo(null);
            return;
        }
        async function updateJettonInfo() {
            if (!jettonAddress) {
                return;
            }
            const jettonInfo = await walletKit?.jettons?.getJettonInfo(jettonAddress.toString(), chainNetwork);
            setJettonInfo(jettonInfo ?? null);
        }
        updateJettonInfo();
    }, [jettonAddress, walletKit, chainNetwork]);
    return jettonInfo;
}

function SafeParseAddress(address: string) {
    try {
        return Address.parse(address).toString();
    } catch {
        return null;
    }
}

export const JettonNameDisplay = memo(function JettonNameDisplay({
    jettonAddress,
}: {
    jettonAddress: Address | string | undefined;
}) {
    const jettonInfo = useJettonInfo(
        jettonAddress
            ? typeof jettonAddress === 'string' && jettonAddress !== 'TON'
                ? SafeParseAddress(jettonAddress)
                : jettonAddress
            : null,
    );

    const name = jettonInfo?.name;
    return <div>{name ?? jettonAddress?.toString() ?? 'UNKNOWN'}</div>;
});

export const JettonAmountDisplay = memo(function JettonAmountDisplay({
    amount,
    jettonAddress,
}: {
    amount: bigint;
    jettonAddress: Address | string | undefined;
}) {
    const jettonInfo = useJettonInfo(
        jettonAddress
            ? typeof jettonAddress === 'string' && jettonAddress !== 'TON'
                ? SafeParseAddress(jettonAddress)
                : jettonAddress
            : null,
    );

    return (
        <div>
            {formatUnits(amount, jettonInfo?.decimals ?? 9)} {jettonInfo?.symbol ?? 'UNKWN'}
        </div>
    );
});

export const JettonImage = memo(function JettonImage({
    jettonAddress,
}: {
    jettonAddress: Address | string | undefined;
}) {
    const jettonInfo = useJettonInfo(
        jettonAddress
            ? typeof jettonAddress === 'string' && jettonAddress !== 'TON'
                ? SafeParseAddress(jettonAddress)
                : jettonAddress
            : null,
    );

    return <img src={jettonInfo?.image} alt={jettonInfo?.name} className="w-8 h-8 rounded-full" />;
    // return <></>;
});

const JettonFlowItem = memo(function JettonFlowItem({
    jettonAddress,
    amount,
}: {
    jettonAddress: Address | string | undefined;
    amount: string;
}) {
    return (
        <div className="flex items-center justify-between">
            <span className="truncate max-w-[200px] flex items-center gap-2">
                <JettonImage jettonAddress={jettonAddress} />
                <JettonNameDisplay jettonAddress={jettonAddress} />
            </span>
            <div className={`flex ml-2 font-medium ${BigInt(amount) >= 0n ? 'text-green-600' : 'text-red-600'}`}>
                {BigInt(amount) >= 0n ? '+' : ''}
                <JettonAmountDisplay amount={BigInt(amount)} jettonAddress={jettonAddress} />
            </div>
        </div>
    );
});
export const JettonFlow = memo(function JettonFlow({ transfers }: { transfers: TransactionTraceMoneyFlowItem[] }) {
    return (
        <div className="mt-2">
            <div className="font-semibold mb-1">Money Flow:</div>
            <div className="flex flex-col gap-2">
                {/* <JettonFlowItem jettonAddress={'TON'} amount={tonDifference} /> */}
                {transfers?.length > 0 ? (
                    transfers.map((transfer) =>
                        transfer.assetType === 'jetton' ? (
                            <JettonFlowItem
                                key={transfer.tokenAddress}
                                jettonAddress={transfer.tokenAddress}
                                amount={transfer.amount}
                            />
                        ) : (
                            <JettonFlowItem
                                key={`${transfer.assetType.toString()}-${transfer.tokenAddress}`}
                                jettonAddress={transfer.assetType.toLocaleUpperCase()}
                                amount={transfer.amount}
                            />
                        ),
                    )
                ) : (
                    <></>
                )}
            </div>
        </div>
    );
});

// no-op
