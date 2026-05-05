/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { memo, useMemo } from 'react';
import type { Action } from '@ton/walletkit';

import { formatTonForDisplay, sameAddress } from '../../utils';
import { TransactionCard } from './TransactionCard';
import type { TxFinality } from './TransactionCard';

interface ActionCardProps {
    action: Action;
    myAddress: string;
    timestamp: number;
    traceLink?: string;
    /** When true, renders as pending (spinner icon, "Pending" status) */
    isPending?: boolean;
    /** Finality: pending, confirmed, finalized, or done (default from isPending) */
    finality?: TxFinality;
    /** Debug ID for DOM inspection (data-debug-id) */
    debugId?: string;
}

/**
 * Wrapper that extracts Action data and renders TransactionCard
 */
const TON_TRANSFER_DESC = /^Transferring (.+) TON$/;
const TON_VALUE = /^(.+) TON$/;
const JETTON_TRANSFER_DESC = /^Transferring (.+)$/;

function isOutgoingFromAction(action: Action, myAddress: string): boolean {
    if (action.type === 'TonTransfer' && 'TonTransfer' in action) {
        return sameAddress(action.TonTransfer?.sender?.address, myAddress);
    }
    if (action.type === 'JettonTransfer' && 'JettonTransfer' in action) {
        return sameAddress(action.JettonTransfer?.sender?.address, myAddress);
    }
    if (action.type === 'NftItemTransfer' && 'NftItemTransfer' in action) {
        return sameAddress(action.NftItemTransfer?.sender?.address, myAddress);
    }
    const accounts = action.simplePreview?.accounts;
    return accounts != null && accounts.length > 0 && sameAddress(accounts[0].address, myAddress);
}

export const ActionCard: React.FC<ActionCardProps> = memo(
    ({ action, myAddress, timestamp, traceLink, isPending = false, finality: finalityProp, debugId }) => {
        const { simplePreview, status } = action;
        const { description, value, valueImage } = simplePreview;

        const isOutgoing = isOutgoingFromAction(action, myAddress);
        const txStatus = isPending ? 'pending' : status === 'failure' ? 'failure' : 'success';
        const finality: TxFinality = finalityProp ?? (isPending ? 'pending' : status === 'failure' ? 'done' : 'done');

        const { description: displayDesc, value: displayValue } = useMemo(() => {
            const descMatch = description?.match(TON_TRANSFER_DESC);
            const valueMatch = value?.match(TON_VALUE);
            if (descMatch && valueMatch && action.type === 'TonTransfer') {
                const amount = formatTonForDisplay(valueMatch[1]);
                const label = isOutgoing ? 'Sent' : 'Received';
                return {
                    description: `${label} ${amount} TON`,
                    value: `${amount} TON`,
                };
            }
            if (valueMatch && action.type === 'TonTransfer') {
                const amount = formatTonForDisplay(valueMatch[1]);
                return { description, value: `${amount} TON` };
            }
            const jettonMatch = description?.match(JETTON_TRANSFER_DESC);
            if (jettonMatch && action.type === 'JettonTransfer') {
                const label = isOutgoing ? 'Sent' : 'Received';
                return {
                    description: `${label} ${jettonMatch[1]}`,
                    value: value ?? '',
                };
            }
            return { description, value };
        }, [description, value, action.type, isOutgoing]);

        return (
            <TransactionCard
                description={displayDesc}
                value={displayValue}
                valueImage={valueImage}
                timestamp={timestamp}
                traceLink={traceLink}
                status={txStatus}
                finality={finality}
                isOutgoing={isOutgoing}
                debugId={debugId}
            />
        );
    },
);
