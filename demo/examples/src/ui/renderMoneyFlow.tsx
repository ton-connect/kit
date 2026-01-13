/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React from 'react';

// SAMPLE_START: RENDER_MONEY_FLOW_1
import type { MoneyFlowSelf } from '@ton/walletkit';
// SAMPLE_END: RENDER_MONEY_FLOW_1

// SAMPLE_START: RENDER_MONEY_FLOW_2
export function renderMoneyFlow(transfers: MoneyFlowSelf[]) {
    if (transfers.length === 0) {
        return <div>This transaction doesn't involve any token transfers</div>;
    }

    return transfers.map((transfer) => {
        const amount = BigInt(transfer.amount);
        const isIncoming = amount >= 0n;
        const jettonAddress = transfer.type === 'jetton' ? transfer.jetton : 'TON';

        return (
            <div key={jettonAddress}>
                <span>
                    {isIncoming ? '+' : ''}
                    {transfer.amount}
                </span>
                <span>{jettonAddress}</span>
            </div>
        );
    });
}
// SAMPLE_END: RENDER_MONEY_FLOW_2
