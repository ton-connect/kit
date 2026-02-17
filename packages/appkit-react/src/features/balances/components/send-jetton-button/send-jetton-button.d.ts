/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import type { FC } from 'react';
import type { TransactionProps } from '../../../transaction';
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
export declare const SendJettonButton: FC<SendJettonButtonProps>;
//# sourceMappingURL=send-jetton-button.d.ts.map