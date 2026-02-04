/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useCallback } from 'react';
import type { FC } from 'react';

import { useSelectedWallet } from '../../../wallets';
import { Transaction } from '../../../transaction';
import type { TransactionProps } from '../../../transaction';

export interface SendButtonProps extends Omit<TransactionProps, 'getTransactionRequest'> {
    tokenType: 'TON' | 'JETTON';
    recipientAddress: string;
    amount: string;
    jettonAddress?: string;
    comment?: string;
}

export const SendButton: FC<SendButtonProps> = ({
    tokenType,
    jettonAddress,
    recipientAddress,
    amount,
    comment,
    ...props
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
            disabled={!recipientAddress || !amount}
            {...props}
        />
    );
};
