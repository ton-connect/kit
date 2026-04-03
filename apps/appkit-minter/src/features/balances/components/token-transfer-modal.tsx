/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { useMemo, useState } from 'react';
import type { Jetton } from '@ton/appkit';
import { getFormattedJettonInfo, getErrorMessage } from '@ton/appkit';
import { SendTonButton, SendJettonButton, Button, Input, Modal } from '@ton/appkit-react';
import { Gem } from 'lucide-react';

import { TransactionStatus } from '@/features/transaction';

interface TokenTransferModalProps {
    tokenType: 'TON' | 'JETTON';
    jetton?: Jetton;
    tonBalance: string;
    isOpen: boolean;
    onClose: () => void;
}

export const TokenTransferModal: React.FC<TokenTransferModalProps> = ({
    tokenType,
    jetton,
    tonBalance,
    isOpen,
    onClose,
}) => {
    const [recipientAddress, setRecipientAddress] = useState('');
    const [amount, setAmount] = useState('');
    const [comment, setComment] = useState('');
    const [transferError, setTransferError] = useState<string | null>(null);
    const [txBoc, setTxBoc] = useState<string | null>(null);

    const tokenInfo = useMemo(() => {
        if (tokenType === 'TON') {
            return {
                name: 'Toncoin',
                symbol: 'TON',
                decimals: 9,
                balance: tonBalance,
                image: './ton.png',
                address: null,
            };
        }

        if (!jetton) {
            throw new Error('Jetton not found');
        }

        const jettonInfo = getFormattedJettonInfo(jetton);

        return {
            name: jettonInfo.name,
            symbol: jettonInfo.symbol,
            decimals: jettonInfo.decimals,
            balance: jettonInfo.balance,
            image: jettonInfo.image,
            address: jettonInfo.address,
        };
    }, [tokenType, tonBalance, jetton]);

    const handleClose = () => {
        setRecipientAddress('');
        setAmount('');
        setComment('');
        setTransferError(null);
        setTxBoc(null);
        onClose();
    };

    if (!tokenInfo.decimals) return null;

    return (
        <Modal title={`Transfer ${tokenInfo.name}`} open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center overflow-hidden">
                    {tokenInfo.image ? (
                        <img src={tokenInfo.image} alt={tokenInfo.name} className="w-full h-full object-cover" />
                    ) : tokenType === 'TON' ? (
                        <Gem className="w-6 h-6 text-primary" />
                    ) : (
                        <span className="text-sm font-bold text-muted-foreground">{tokenInfo.symbol?.slice(0, 2)}</span>
                    )}
                </div>
                <div>
                    <p className="text-sm font-medium text-foreground">Available Balance</p>
                    <p className="text-xs text-muted-foreground">
                        {tokenInfo.balance} {tokenInfo.symbol}
                    </p>
                </div>
            </div>

            {txBoc ? (
                <div className="space-y-6">
                    <TransactionStatus boc={txBoc} />
                    <Button fullWidth onClick={handleClose}>
                        Close
                    </Button>
                </div>
            ) : (
                <>
                    <div className="space-y-4">
                        <Input size="s">
                            <Input.Header>
                                <Input.Title>Recipient Address</Input.Title>
                            </Input.Header>
                            <Input.Field>
                                <Input.Input
                                    type="text"
                                    value={recipientAddress}
                                    onChange={(e) => setRecipientAddress(e.target.value)}
                                    placeholder="Enter TON address"
                                />
                            </Input.Field>
                        </Input>

                        <Input size="s">
                            <Input.Header>
                                <Input.Title>Amount</Input.Title>
                            </Input.Header>
                            <Input.Field>
                                <Input.Input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0.00"
                                    step="any"
                                    min="0"
                                />
                            </Input.Field>
                        </Input>

                        <Input size="s">
                            <Input.Header>
                                <Input.Title>Comment (optional)</Input.Title>
                            </Input.Header>
                            <Input.Field>
                                <Input.Input
                                    type="text"
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="Add a comment"
                                />
                            </Input.Field>
                        </Input>

                        {transferError && (
                            <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                                <p className="text-sm text-destructive">{transferError}</p>
                            </div>
                        )}
                    </div>

                    <div className="flex mt-6 gap-3">
                        {tokenType === 'TON' && (
                            <SendTonButton
                                recipientAddress={recipientAddress}
                                amount={amount}
                                comment={comment}
                                onError={(error) => setTransferError(getErrorMessage(error))}
                                onSuccess={(data) => setTxBoc(data.boc)}
                            >
                                {({ isLoading, onSubmit, disabled, text }) => (
                                    <Button
                                        loading={isLoading}
                                        onClick={onSubmit}
                                        disabled={disabled}
                                        className="flex-1"
                                    >
                                        {text}
                                    </Button>
                                )}
                            </SendTonButton>
                        )}

                        {tokenType === 'JETTON' && jetton?.address && (
                            <SendJettonButton
                                jetton={{
                                    address: jetton.address,
                                    symbol: jetton.info?.symbol || 'Jetton',
                                    decimals: tokenInfo.decimals,
                                }}
                                recipientAddress={recipientAddress}
                                amount={amount}
                                comment={comment}
                                onError={(error) => setTransferError(getErrorMessage(error))}
                                onSuccess={(data) => setTxBoc(data.boc)}
                            >
                                {({ isLoading, onSubmit, disabled, text }) => (
                                    <Button
                                        loading={isLoading}
                                        onClick={onSubmit}
                                        disabled={disabled}
                                        className="flex-1"
                                    >
                                        {text}
                                    </Button>
                                )}
                            </SendJettonButton>
                        )}

                        <Button variant="secondary" onClick={handleClose} className="flex-1">
                            Cancel
                        </Button>
                    </div>
                </>
            )}
        </Modal>
    );
};
