/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC } from 'react';
import { parseUnits } from '@ton/appkit';

import { SendButton } from '../send-button';
import type { SendButtonProps } from '../send-button';
import { useI18n } from '../../../../hooks/use-i18n';

export type SendTonButtonProps = Omit<SendButtonProps, 'tokenType' | 'jettonAddress'>;

export const SendTonButton: FC<SendTonButtonProps> = ({ recipientAddress, amount, comment, ...props }) => {
    const { t } = useI18n();

    return (
        <SendButton
            tokenType="TON"
            recipientAddress={recipientAddress}
            amount={parseUnits(amount, 9).toString()}
            comment={comment}
            text={t('balances.sendTon', { amount })}
            {...props}
        />
    );
};
