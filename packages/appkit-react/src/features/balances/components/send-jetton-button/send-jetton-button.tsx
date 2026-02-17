/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useCallback, useMemo } from 'react';
import type { FC } from 'react';
import { createTransferJettonTransaction, formatUnits, parseUnits } from '@ton/appkit';

import { useI18n } from '../../../../hooks/use-i18n';
import { useAppKit } from '../../../../hooks/use-app-kit';
import type { TransactionProps } from '../../../transaction';
import { Transaction } from '../../../transaction';

export interface SendJettonButtonProps extends Omit<TransactionProps, 'request'> {
    recipientAddress: string;
    amount: string;
    jetton: {
        address: string;
        symbol: string;
        decimals: number;
    };
    comment?: string;
}

export const SendJettonButton: FC<SendJettonButtonProps> = ({
    recipientAddress,
    amount,
    comment,
    jetton,
    ...props
}) => {
    const appKit = useAppKit();
    const { t } = useI18n();

    const createTransferTransaction = useCallback(async () => {
        if (!jetton.address) {
            throw new Error('Jetton address is required');
        }

        if (!jetton.decimals) {
            throw new Error('Jetton decimals is required');
        }

        return createTransferJettonTransaction(appKit, {
            jettonAddress: jetton.address,
            recipientAddress,
            amount,
            comment,
            jettonDecimals: jetton.decimals,
        });
    }, [appKit, recipientAddress, amount, comment, jetton]);

    const text = useMemo(() => {
        if (amount && jetton.decimals) {
            return t('balances.sendJettonWithAmount', {
                amount: formatUnits(parseUnits(amount, jetton.decimals), jetton.decimals).toString(),
                symbol: jetton.symbol,
            });
        }

        return t('balances.sendJetton', { symbol: jetton.symbol, amount });
    }, [t, amount, jetton]);

    return (
        <Transaction
            request={createTransferTransaction}
            text={text}
            disabled={!recipientAddress || !amount || !jetton.address || !jetton.decimals}
            {...props}
        />
    );
};
