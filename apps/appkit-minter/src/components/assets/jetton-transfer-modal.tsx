/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { useCallback, useMemo, useState } from 'react';
import type { Jetton } from '@ton/walletkit';
import { getFormattedJettonInfo, getErrorMessage, parseUnits, formatUnits } from '@ton/appkit';
import { useSelectedWallet, Transaction } from '@ton/appkit-ui-react';
import { toast } from 'sonner';

import { Button } from '@/components/common';

interface JettonTransferModalProps {
    jetton: Jetton;
    isOpen: boolean;
    onClose: () => void;
}

export const JettonTransferModal: React.FC<JettonTransferModalProps> = ({ jetton, isOpen, onClose }) => {
    const [recipientAddress, setRecipientAddress] = useState('');
    const [amount, setAmount] = useState('');
    const [comment, setComment] = useState('');
    const [transferError, setTransferError] = useState<string | null>(null);

    const [wallet] = useSelectedWallet();

    const jettonInfo = useMemo(() => getFormattedJettonInfo(jetton), [jetton]);

    const createTransferTransaction = useCallback(async () => {
        if (!wallet) return null;

        const decimals = jettonInfo.decimals;
        const amountNum = parseFloat(amount);

        if (!decimals) {
            throw new Error('Jetton decimals not found');
        }

        if (isNaN(amountNum) || amountNum <= 0) {
            throw new Error('Invalid amount');
        }

        const transferAmount = parseUnits(amount, decimals).toString();

        const transaction = await wallet.createTransferJettonTransaction({
            jettonAddress: jettonInfo.address,
            recipientAddress,
            transferAmount,
            comment,
        });

        return transaction;
    }, [wallet, jettonInfo, recipientAddress, amount, comment]);

    const handleClose = () => {
        setRecipientAddress('');
        setAmount('');
        setComment('');
        setTransferError(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-card rounded-lg max-w-md w-full">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center overflow-hidden">
                                {jettonInfo.image ? (
                                    <img
                                        src={jettonInfo.image}
                                        alt={jettonInfo.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-sm font-bold text-muted-foreground">
                                        {jettonInfo.symbol?.slice(0, 2)}
                                    </span>
                                )}
                            </div>
                            <div>
                                <h3 className="text-lg font-medium text-card-foreground">Transfer {jettonInfo.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                    Balance:{' '}
                                    {jettonInfo.decimals
                                        ? formatUnits(jettonInfo.balance, jettonInfo.decimals)
                                        : jettonInfo.balance}{' '}
                                    {jettonInfo.symbol}
                                </p>
                            </div>
                        </div>
                        <button onClick={handleClose} className="text-muted-foreground hover:text-foreground">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1">
                                Recipient Address
                            </label>
                            <input
                                type="text"
                                value={recipientAddress}
                                onChange={(e) => setRecipientAddress(e.target.value)}
                                placeholder="Enter TON address"
                                className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-ring text-sm text-foreground placeholder:text-muted-foreground"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1">Amount</label>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                                step="any"
                                min="0"
                                className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-ring text-sm text-foreground placeholder:text-muted-foreground"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1">
                                Comment (optional)
                            </label>
                            <input
                                type="text"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Add a comment"
                                className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-ring text-sm text-foreground placeholder:text-muted-foreground"
                            />
                        </div>

                        {transferError && (
                            <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                                <p className="text-sm text-destructive">{transferError}</p>
                            </div>
                        )}
                    </div>

                    <div className="flex mt-6 gap-3">
                        <Transaction
                            getTransactionRequest={createTransferTransaction}
                            onSuccess={() => {
                                handleClose();
                                toast.success('Transfer successful');
                            }}
                            onError={(error) => {
                                setTransferError(getErrorMessage(error));
                            }}
                            disabled={!recipientAddress || !amount}
                        >
                            {({ isLoading, onSubmit, disabled, text }) => (
                                <Button isLoading={isLoading} onClick={onSubmit} disabled={disabled} className="flex-1">
                                    {text}
                                </Button>
                            )}
                        </Transaction>

                        <Button variant="secondary" onClick={handleClose} className="flex-1">
                            Cancel
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
