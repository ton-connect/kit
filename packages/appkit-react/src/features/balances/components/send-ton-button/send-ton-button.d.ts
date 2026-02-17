/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import type { FC } from 'react';
import type { TransactionProps } from '../../../transaction';
export interface SendTonButtonProps extends Omit<TransactionProps, 'request'> {
    recipientAddress: string;
    amount: string;
    comment?: string;
}
export declare const SendTonButton: FC<SendTonButtonProps>;
//# sourceMappingURL=send-ton-button.d.ts.map