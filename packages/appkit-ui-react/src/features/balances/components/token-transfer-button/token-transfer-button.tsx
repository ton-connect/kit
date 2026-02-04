/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { useCallback } from 'react';
import type { ReactNode } from 'react';
import { getErrorMessage } from '@ton/appkit';

import { useSelectedWallet } from '../../../wallets';
import { Transaction } from '../../../transaction';
import type { TransactionRenderProps } from '../../../transaction';

export interface TransferButtonProps {
    tokenType: 'TON' | 'JETTON';
    jettonAddress?: string;
    recipientAddress: string;
    amount: string;
    comment?: string;
    onError: (error: string) => void;
    onSuccess: () => void;
    children?: (props: TransactionRenderProps) => ReactNode;
}

export const TransferButton: React.FC<TransferButtonProps> = ({
    tokenType,
    jettonAddress,
    recipientAddress,
    amount,
    comment,
    onError,
    onSuccess,
    children,
}) => {
    const [wallet] = useSelectedWallet();

    const createTransferTransaction = useCallback(async () => {
        if (!wallet) return null;

        const amountNum = parseFloat(amount);

        if (isNaN(amountNum) || amountNum <= 0) {
            throw new Error('Invalid amount');
        }

        if (tokenType === 'TON') {
            const transaction = await wallet.createTransferTonTransaction({
                recipientAddress,
                transferAmount: amount,
                comment,
            });

            return transaction;
        } else {
            if (!jettonAddress) {
                throw new Error('Jetton address not found');
            }

            const transaction = await wallet.createTransferJettonTransaction({
                jettonAddress,
                recipientAddress,
                transferAmount: amount,
                comment,
            });

            return transaction;
        }
    }, [wallet, tokenType, recipientAddress, amount, comment]);

    return (
        <Transaction
            getTransactionRequest={createTransferTransaction}
            onSuccess={onSuccess}
            onError={(error) => onError(getErrorMessage(error))}
            disabled={!recipientAddress || !amount}
        >
            {children}
        </Transaction>
    );
};
