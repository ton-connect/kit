/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// SAMPLE_START: SUMMARIZE_TRANSACTION_1
import type { TransactionEmulatedPreview } from '@ton/walletkit';
import { AssetType, Result } from '@ton/walletkit';
// SAMPLE_END: SUMMARIZE_TRANSACTION_1

// SAMPLE_START: SUMMARIZE_TRANSACTION_2

function summarizeTransaction(preview: TransactionEmulatedPreview) {
    if (preview.result === Result.failure) {
        return { kind: 'error', message: preview?.error?.message ?? 'Unknown error' };
    }

    // MoneyFlow now provides ourTransfers - a simplified array of net asset changes
    const transfers = preview.moneyFlow ? preview.moneyFlow.ourTransfers : []; // Array of TransactionTraceMoneyFlow

    // Each transfer has:
    // - assetType: 'ton' | 'jetton' | 'nft'
    // - amount: string (positive for incoming, negative for outgoing)
    // - tokenAddress?: string (jetton master address, if type === 'jetton' or 'nft')

    return {
        kind: 'success' as const,
        transfers: transfers.map((transfer) => ({
            assetType: transfer.assetType,
            jettonAddress: transfer.assetType === AssetType.ton ? 'TON' : (transfer.tokenAddress ?? ''),
            amount: transfer.amount, // string, can be positive or negative
            isIncoming: BigInt(transfer.amount) >= 0n,
        })),
    };
}
// SAMPLE_END: SUMMARIZE_TRANSACTION_2

export function applySummarizeTransaction(preview: TransactionEmulatedPreview) {
    return summarizeTransaction(preview);
}
