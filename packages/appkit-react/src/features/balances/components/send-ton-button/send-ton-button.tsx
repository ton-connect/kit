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

import { useI18n, useAppKit } from '../../../settings';
import type { SendProps } from '../../../transaction';
import { Send } from '../../../transaction';

/**
 * Props accepted by {@link SendTonButton} — extends the base `Send` button props (button text, sizing, callbacks) with the TON-transfer details.
 *
 * @public
 * @category Type
 * @section Balances
 */
export interface SendTonButtonProps extends Omit<SendProps, 'request'> {
    /** Recipient address. */
    recipientAddress: string;
    /** Amount in TON as a human-readable decimal string (e.g., `"1.5"`). Converted to nano-TON internally. */
    amount: string;
    /** Optional human-readable comment attached to the transfer. */
    comment?: string;
}

/**
 * Pre-wired button that builds a TON transfer with {@link appkit:createTransferTonTransaction} and dispatches it through the standard `Send` flow on click — disabled until both `recipientAddress` and `amount` are set.
 *
 * @sample docs/examples/src/appkit/components/balances#SEND_TON_BUTTON
 *
 * @public
 * @category Component
 * @section Balances
 */
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
        <Send
            request={createTransferTransaction}
            disabled={!recipientAddress || !amount}
            text={t('balances.sendTon', { amount })}
            {...props}
        />
    );
};
