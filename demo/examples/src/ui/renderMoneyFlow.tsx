/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// eslint-disable-next-line import/order
import React from 'react';

// SAMPLE_START: RENDER_MONEY_FLOW_1
import type { TransactionTraceMoneyFlowItem } from '@ton/walletkit';
import { AssetType } from '@ton/walletkit';
// SAMPLE_END: RENDER_MONEY_FLOW_1

// SAMPLE_START: RENDER_MONEY_FLOW_2
function renderMoneyFlow(transfers: TransactionTraceMoneyFlowItem[]) {
    if (transfers.length === 0) {
        return <div>This transaction doesn't involve any token transfers</div>;
    }

    return transfers.map((transfer: TransactionTraceMoneyFlowItem) => {
        const amount = BigInt(transfer.amount);
        const isIncoming = amount >= 0n;
        const jettonAddress = transfer.assetType === AssetType.ton ? 'TON' : (transfer.tokenAddress ?? '');

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

export function applyRenderMoneyFlow(transfers: TransactionTraceMoneyFlowItem[]) {
    return renderMoneyFlow(transfers);
}
