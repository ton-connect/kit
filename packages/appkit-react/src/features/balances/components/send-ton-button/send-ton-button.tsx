/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useCallback } from 'react';
import type { FC } from 'react';
import { createTransferTonTransaction } from '@ton/appkit';

import { useI18n } from '../../../../hooks/use-i18n';
import { useAppKit } from '../../../../hooks/use-app-kit';
import type { TransactionProps } from '../../../transaction';
import { Transaction } from '../../../transaction';

export interface SendTonButtonProps extends Omit<TransactionProps, 'request'> {
    recipientAddress: string;
    amount: string;
    comment?: string;
}

export const SendTonButton: FC<SendTonButtonProps> = ({ recipientAddress, amount, comment, ...props }) => {
    const appKit = useAppKit();
    const { t } = useI18n();

    const createTransferTransaction = useCallback(async () => {
        return createTransferTonTransaction(appKit, {
            recipientAddress,
            amount,
            comment,
        });
    }, [appKit, recipientAddress, amount, comment]);

    return (
        <Transaction
            request={createTransferTransaction}
            disabled={!recipientAddress || !amount}
            text={t('balances.sendTon', { amount })}
            {...props}
        />
    );
};
