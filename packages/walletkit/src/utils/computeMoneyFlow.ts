/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { EmulationResponse } from '../api/models';
import type {
    TransactionTraceMoneyFlow,
    TransactionTraceMoneyFlowItem,
} from '../api/models/transactions/TransactionTraceMoneyFlow';
import { AssetType } from '../api/models/core/AssetType';
import { asMaybeAddressFriendly } from './address';
import type { Hex } from '../api/models';

const JETTON_TRANSFER_OPCODE = '0x0f8a7ea5' as Hex;

// pTON proxy contracts (STON.fi v1 and v2) — wrapped TON used in DEX swaps.
// TON flow is already captured in outputs/inputs, so exclude these from ourTransfers.
const TON_PROXY_ADDRESSES = new Set([
    'EQCM3B12QK1e4yZSf8GtBRT0aLMNyEsBc_DhVfRRtOEffLez',
    'EQBnGWMCf3-FZZq1W4IWcWiGAc3PHuZ0_H-7sad2oY00o83S',
]);

export function computeMoneyFlow(response: EmulationResponse): TransactionTraceMoneyFlow {
    const empty: TransactionTraceMoneyFlow = {
        outputs: '0',
        inputs: '0',
        allJettonTransfers: [],
        ourTransfers: [],
        ourAddress: undefined,
    };

    const rootTxHash = response.trace?.txHash;
    if (!rootTxHash) return empty;

    const rootTx = response.transactions[rootTxHash];
    if (!rootTx) return empty;

    const ourAddress = rootTx.account;
    const ourTxs = Object.values(response.transactions).filter((tx) => tx.account === ourAddress);

    const outputs = ourTxs.reduce((acc, tx) => tx.outMsgs.reduce((a, m) => a + BigInt(m.value ?? 0), acc), 0n);

    const inputs = ourTxs.reduce((acc, tx) => (tx.inMsg?.value ? acc + BigInt(tx.inMsg.value) : acc), 0n);

    const jettonTxHashes = new Set(
        Object.values(response.transactions)
            .filter((tx) => tx.inMsg?.opcode === JETTON_TRANSFER_OPCODE)
            .map((tx) => tx.hash),
    );

    const allJettonTransfers: TransactionTraceMoneyFlowItem[] = response.actions
        .filter((a) => a.isSuccess && a.transactions.some((h) => jettonTxHashes.has(h)))
        .map((a) => {
            const asset = a.details?.asset;
            const sender = a.details?.sender;
            const receiver = a.details?.receiver;
            return {
                assetType: AssetType.jetton,
                tokenAddress: typeof asset === 'string' ? (asMaybeAddressFriendly(asset) ?? undefined) : undefined,
                fromAddress: typeof sender === 'string' ? (asMaybeAddressFriendly(sender) ?? undefined) : undefined,
                toAddress: typeof receiver === 'string' ? (asMaybeAddressFriendly(receiver) ?? undefined) : undefined,
                amount: String(a.details?.amount ?? 0),
            };
        });

    const ourJettonByAddress: Record<string, bigint> = {};
    for (const jt of allJettonTransfers) {
        if (!jt.tokenAddress) continue;
        if (TON_PROXY_ADDRESSES.has(jt.tokenAddress)) continue;
        ourJettonByAddress[jt.tokenAddress] ??= 0n;
        if (jt.toAddress === ourAddress) ourJettonByAddress[jt.tokenAddress] += BigInt(jt.amount);
        if (jt.fromAddress === ourAddress) ourJettonByAddress[jt.tokenAddress] -= BigInt(jt.amount);
    }

    const ourJettonTransfers: TransactionTraceMoneyFlowItem[] = Object.entries(ourJettonByAddress).map(
        ([addr, amount]) => ({
            assetType: AssetType.jetton,
            tokenAddress: addr,
            amount: amount.toString(),
        }),
    );

    return {
        outputs: outputs.toString(),
        inputs: inputs.toString(),
        allJettonTransfers,
        ourTransfers: [{ assetType: AssetType.ton, amount: (inputs - outputs).toString() }, ...ourJettonTransfers],
        ourAddress,
    };
}
