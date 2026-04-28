/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Slice } from '@ton/core';
import { Address, Cell } from '@ton/core';

import type { EmulationMessage as RawMessage } from '../../../types/toncenter/emulation';
import type { ToncenterEmulationResponse } from '../types/raw-emulation';
import type { EmulationTokenInfoWallets } from '../types/metadata';
import type {
    TransactionTraceMoneyFlow,
    TransactionTraceMoneyFlowItem,
} from '../../../api/models/transactions/TransactionTraceMoneyFlow';
import { AssetType } from '../../../api/models/core/AssetType';
import { asAddressFriendly, asMaybeAddressFriendly } from '../../../utils/address';

const TON_PROXY_ADDRESSES = [
    'EQCM3B12QK1e4yZSf8GtBRT0aLMNyEsBc_DhVfRRtOEffLez',
    'EQBnGWMCf3-FZZq1W4IWcWiGAc3PHuZ0_H-7sad2oY00o83S',
];

const JETTON_TRANSFER_OPCODE = 0x0f8a7ea5;

interface JettonTransfer {
    amount: bigint;
    destination: Address | null;
}

function parseJettonTransfer(slice: Slice): JettonTransfer {
    if (slice.remainingBits < 32 || slice.preloadUint(32) !== JETTON_TRANSFER_OPCODE) {
        throw new Error('Expected JettonTransfer opcode');
    }
    slice.loadUint(32);
    slice.loadUintBig(64); // query_id
    const amount = slice.loadCoins();
    const destination = slice.loadMaybeAddress();
    return { amount, destination };
}

export function computeMoneyFlow(raw: ToncenterEmulationResponse): TransactionTraceMoneyFlow {
    const empty: TransactionTraceMoneyFlow = {
        outputs: '0',
        inputs: '0',
        allJettonTransfers: [],
        ourTransfers: [],
        ourAddress: undefined,
    };

    if (!raw.transactions || !raw.trace) return empty;

    const firstTx = raw.transactions[raw.trace.tx_hash];
    if (!firstTx) return empty;

    const ourAccount = firstTx.account;
    const ourTxes = Object.values(raw.transactions).filter((t) => t.account === ourAccount);

    const messagesFrom = ourTxes.flatMap((t) => t.out_msgs);
    const messagesTo = ourTxes.flatMap((t) => t.in_msg).filter((m): m is RawMessage => m !== null);

    const outputs = messagesFrom.reduce((acc, m) => acc + (m.value ? BigInt(m.value) : 0n), 0n).toString();

    const inputs = messagesTo.reduce((acc, m) => acc + (m.value ? BigInt(m.value) : 0n), 0n).toString();

    const allJettonTransfers: TransactionTraceMoneyFlowItem[] = [];

    for (const t of Object.values(raw.transactions)) {
        if (!t.in_msg?.source) continue;

        let parsed: JettonTransfer | null = null;
        try {
            parsed = parseJettonTransfer(Cell.fromBase64(t.in_msg.message_content.body).beginParse());
        } catch {
            continue;
        }

        const to = parsed.destination instanceof Address ? parsed.destination : null;
        if (!to) continue;

        const tokenInfo = raw.metadata?.[t.account]?.token_info?.find(
            (info): info is EmulationTokenInfoWallets => info.valid && info.type === 'jetton_wallets',
        );
        if (!tokenInfo) continue;

        allJettonTransfers.push({
            fromAddress: asMaybeAddressFriendly(t.in_msg.source) ?? undefined,
            toAddress: asMaybeAddressFriendly(to.toString()) ?? undefined,
            tokenAddress: asMaybeAddressFriendly(tokenInfo.extra.jetton) ?? undefined,
            amount: parsed.amount.toString(),
            assetType: AssetType.jetton,
        });
    }

    const ourAddress = Address.parse(ourAccount);
    const ourFriendlyAddress = asAddressFriendly(ourAddress);

    const ourJettonByAddress = allJettonTransfers.reduce<Record<string, bigint>>((acc, transfer) => {
        if (!transfer.tokenAddress || TON_PROXY_ADDRESSES.includes(transfer.tokenAddress)) return acc;
        const rawKey = Address.parse(transfer.tokenAddress).toRawString().toUpperCase();
        acc[rawKey] ??= 0n;
        if (transfer.toAddress === ourFriendlyAddress) acc[rawKey] += BigInt(transfer.amount);
        if (transfer.fromAddress === ourFriendlyAddress) acc[rawKey] -= BigInt(transfer.amount);
        return acc;
    }, {});

    const ourJettonTransfers: TransactionTraceMoneyFlowItem[] = Object.entries(ourJettonByAddress).map(
        ([jettonKey, amount]) => ({
            assetType: AssetType.jetton,
            tokenAddress: asMaybeAddressFriendly(jettonKey) ?? undefined,
            amount: amount.toString(),
        }),
    );

    return {
        outputs,
        inputs,
        allJettonTransfers,
        ourTransfers: [
            { assetType: AssetType.ton, amount: (BigInt(inputs) - BigInt(outputs)).toString() },
            ...ourJettonTransfers,
        ],
        ourAddress: ourFriendlyAddress,
    };
}
