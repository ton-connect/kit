/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { parseInternal } from '@truecarry/tlb-abi';
import { Address, Cell } from '@ton/core';

import type {
    EmulationTokenInfoWallets,
    ToncenterEmulationResponse,
    ToncenterTransaction,
} from '../types/toncenter/emulation';
import type { TransactionTraceMoneyFlowItem } from '../api/models';
import { AssetType } from '../api/models';
import { asMaybeAddressFriendly } from '../utils';

export function parseInternalMoneyFlow(input: {
    transaction: ToncenterTransaction;
    emulation: ToncenterEmulationResponse;
}): TransactionTraceMoneyFlowItem | null {
    if (!input.transaction.in_msg?.source) {
        return null;
    }

    const parsed = parseInternal(Cell.fromBase64(input.transaction.in_msg.message_content.body).beginParse());

    if (parsed?.internal !== 'jetton_transfer') {
        return null;
    }

    const from = asMaybeAddressFriendly(input.transaction.in_msg.source);
    const to = parsed.data.destination instanceof Address ? parsed.data.destination : null;
    if (!to) {
        return null;
    }
    const jettonAmount = parsed.data.amount;

    const metadata = input.emulation.metadata[input.transaction.account];
    if (!metadata || !metadata?.token_info) {
        return null;
    }

    const tokenInfo = metadata.token_info.find((t) => t.valid && t.type === 'jetton_wallets') as
        | EmulationTokenInfoWallets
        | undefined;

    if (!tokenInfo) {
        return null;
    }

    const jettonAddress = asMaybeAddressFriendly(tokenInfo.extra.jetton);

    return {
        fromAddress: from ?? undefined,
        toAddress: asMaybeAddressFriendly(to.toString()) ?? undefined,
        tokenAddress: jettonAddress ?? undefined,
        amount: jettonAmount.toString(),
        assetType: AssetType.jetton,
    } as TransactionTraceMoneyFlowItem;
}
