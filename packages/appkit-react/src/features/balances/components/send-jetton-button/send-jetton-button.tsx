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

import { useI18n, useAppKit } from '../../../settings';
import type { SendProps } from '../../../transaction';
import { Send } from '../../../transaction';

/**
 * Props accepted by {@link SendJettonButton} — extends the base {@link Send} button props (button text, sizing, callbacks) with the jetton-transfer details.
 *
 * @public
 * @category Type
 * @section Balances
 */
export interface SendJettonButtonProps extends Omit<SendProps, 'request'> {
    /** Recipient address. */
    recipientAddress: string;
    /** Amount in jetton units as a human-readable decimal string; converted to raw smallest units via `jetton.decimals`. */
    amount: string;
    /** Jetton master metadata — `address` (master contract), `symbol` (rendered in the button label) and `decimals` (used to format `amount`). */
    jetton: {
        address: string;
        symbol: string;
        decimals: number;
    };
    /** Optional human-readable comment attached to the transfer. */
    comment?: string;
}

/**
 * Pre-wired button that builds a jetton transfer with {@link createTransferJettonTransaction} and dispatches it through the standard {@link Send} flow on click — disabled until `recipientAddress`, `amount`, `jetton.address` and a non-zero `jetton.decimals` are all set; throws inside the click handler when `jetton.address` is missing or `jetton.decimals` is falsy. (A `0`-decimal jetton must be passed as a truthy value to avoid being treated as missing.)
 *
 * @public
 * @category Component
 * @section Balances
 */
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
        <Send
            request={createTransferTransaction}
            text={text}
            disabled={!recipientAddress || !amount || !jetton.address || !jetton.decimals}
            {...props}
        />
    );
};
