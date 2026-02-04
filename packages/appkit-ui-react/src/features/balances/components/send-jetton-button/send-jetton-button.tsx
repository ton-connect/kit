/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useMemo } from 'react';
import type { FC } from 'react';
import type { Jetton } from '@ton/walletkit';
import { formatUnits, getFormattedJettonInfo } from '@ton/appkit';

import { SendButton } from '../send-button';
import type { SendButtonProps } from '../send-button';
import { useI18n } from '../../../../hooks/use-i18n';

export type SendJettonButtonProps = Omit<SendButtonProps, 'tokenType' | 'jettonAddress'> & {
    jetton: Jetton;
};

export const SendJettonButton: FC<SendJettonButtonProps> = ({
    recipientAddress,
    amount,
    comment,
    jetton,
    ...props
}) => {
    const { t } = useI18n();

    const text = useMemo(() => {
        const jettonInfo = getFormattedJettonInfo(jetton);

        if (amount && jettonInfo.decimals) {
            return t('balances.sendJettonWithAmount', {
                amount: formatUnits(amount, jettonInfo.decimals),
                symbol: jettonInfo.symbol,
            });
        }

        return t('balances.sendJetton', { symbol: jettonInfo.symbol });
    }, [t, amount, jetton]);

    return (
        <SendButton
            tokenType="JETTON"
            recipientAddress={recipientAddress}
            amount={amount}
            comment={comment}
            jettonAddress={jetton.address}
            text={text}
            {...props}
        />
    );
};
