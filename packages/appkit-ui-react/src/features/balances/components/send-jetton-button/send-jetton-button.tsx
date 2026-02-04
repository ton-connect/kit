/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC } from 'react';

import { SendButton } from '../send-button';
import type { SendButtonProps } from '../send-button';

export type SendJettonButtonProps = Omit<SendButtonProps, 'tokenType' | 'jettonAddress'> & {
    jettonAddress: string;
};

export const SendJettonButton: FC<SendJettonButtonProps> = ({
    recipientAddress,
    amount,
    comment,
    jettonAddress,
    ...props
}) => {
    return (
        <SendButton
            tokenType="JETTON"
            recipientAddress={recipientAddress}
            amount={amount}
            comment={comment}
            jettonAddress={jettonAddress}
            {...props}
        />
    );
};
