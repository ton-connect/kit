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

export type SendTonButtonProps = Omit<SendButtonProps, 'tokenType' | 'jettonAddress'>;

export const SendTonButton: FC<SendTonButtonProps> = ({ recipientAddress, amount, comment, ...props }) => {
    return (
        <SendButton tokenType="TON" recipientAddress={recipientAddress} amount={amount} comment={comment} {...props} />
    );
};
