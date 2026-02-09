/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useCallback } from 'react';
import type { FC } from 'react';
import { createTransferTonTransaction, createTransferJettonTransaction } from '@ton/appkit';

import { useAppKit } from '../../../../hooks/use-app-kit';
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
    const appKit = useAppKit();

    const createTransferTransaction = useCallback(async () => {
        if (tokenType === 'TON') {
            return createTransferTonTransaction(appKit, {
                recipientAddress,
                amount,
                comment,
            });
        }

        if (!jettonAddress) {
            throw new Error('Jetton address is required');
        }

        return createTransferJettonTransaction(appKit, {
            jettonAddress,
            recipientAddress,
            amount,
            comment,
        });
    }, [appKit, tokenType, recipientAddress, amount, comment, jettonAddress]);

    return (
        <Transaction
            getTransactionRequest={createTransferTransaction}
            disabled={!recipientAddress || !amount}
            {...props}
        />
    );
};
