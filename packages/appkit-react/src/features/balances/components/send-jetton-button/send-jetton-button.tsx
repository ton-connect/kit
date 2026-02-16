/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useMemo } from 'react';
import type { FC } from 'react';
import { formatUnits, parseUnits } from '@ton/appkit';

import { SendButton } from '../send-button';
import type { SendButtonProps } from '../send-button';
import { useI18n } from '../../../../hooks/use-i18n';

export type SendJettonButtonProps = Omit<SendButtonProps, 'tokenType' | 'jettonAddress'> & {
    jetton: {
        address: string;
        symbol: string;
        decimals: number;
    };
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
        if (amount && jetton.decimals) {
            return t('balances.sendJettonWithAmount', {
                amount: formatUnits(parseUnits(amount, jetton.decimals), jetton.decimals).toString(),
                symbol: jetton.symbol,
            });
        }

        return t('balances.sendJetton', { symbol: jetton.symbol, amount });
    }, [t, amount, jetton]);

    return (
        <SendButton
            tokenType="JETTON"
            recipientAddress={recipientAddress}
            amount={parseUnits(amount, jetton.decimals).toString()}
            comment={comment}
            jettonAddress={jetton.address}
            text={text}
            {...props}
        />
    );
};
