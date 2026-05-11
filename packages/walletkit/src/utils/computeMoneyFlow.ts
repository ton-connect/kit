/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Slice } from '@ton/core';
import { Cell, Address } from '@ton/core';

import type { EmulationResponse, UserFriendlyAddress } from '../api/models';
import type {
    TransactionTraceMoneyFlow,
    TransactionTraceMoneyFlowItem,
} from '../api/models/transactions/TransactionTraceMoneyFlow';
import { AssetType } from '../api/models/core/AssetType';
import { asMaybeAddressFriendly } from './address';
import { getJettonMasterAddressFromClient } from './assetHelpers';
import type { ApiClient } from '../api/interfaces';

export interface ProcessMoneyFlowOptions {
    // When true, the first transaction's incoming message is excluded from inputs
    // (used for sign-message previews where that message is a synthetic 2-TON gasless-relay wrapper).
    skipFirstTxInput?: boolean;
}

const JETTON_TRANSFER_OPCODE = 0x0f8a7ea5;
// const JETTON_TRANSFER_OPCODE_HEX = '0x0f8a7ea5' as Hex;

// pTON proxy contracts (STON.fi v1 and v2) — wrapped TON used in DEX swaps.
// TON flow is already captured in outputs/inputs, so exclude these from ourTransfers.
const TON_PROXY_ADDRESSES = new Set([
    'EQCM3B12QK1e4yZSf8GtBRT0aLMNyEsBc_DhVfRRtOEffLez',
    'EQBnGWMCf3-FZZq1W4IWcWiGAc3PHuZ0_H-7sad2oY00o83S',
]);

interface RawJettonTransfer {
    kind: 'JettonTransfer';
    query_id: bigint;
    amount: bigint;
    destination: Address | null;
    response_destination: Address | null;
    custom_payload: Cell | null;
    forward_ton_amount: bigint;
}

function parseJettonTransfer(slice: Slice): RawJettonTransfer {
    if (slice.remainingBits < 32 || slice.preloadUint(32) !== JETTON_TRANSFER_OPCODE) {
        throw new Error('Expected JettonTransfer opcode 0x0f8a7ea5');
    }

    slice.loadUint(32); // skip opcode

    const queryId = slice.loadUintBig(64);
    const amount = slice.loadCoins();
    const destination = slice.loadMaybeAddress();
    const responseDestination = slice.loadMaybeAddress();

    // Load Maybe<Cell> for custom_payload
    const customPayloadFlag = slice.loadUint(1);
    const customPayload = customPayloadFlag === 0 ? null : slice.loadRef();

    const forwardTonAmount = slice.loadCoins();

    return {
        kind: 'JettonTransfer',
        query_id: queryId,
        amount: amount,
        destination,
        response_destination: responseDestination,
        custom_payload: customPayload,
        forward_ton_amount: forwardTonAmount,
    };
}

export async function computeMoneyFlow(
    client: ApiClient,
    response: EmulationResponse,
    options: ProcessMoneyFlowOptions = {},
): Promise<TransactionTraceMoneyFlow> {
    const empty: TransactionTraceMoneyFlow = {
        outputs: '0',
        inputs: '0',
        allJettonTransfers: [],
        ourTransfers: [],
        ourAddress: undefined,
    };

    if (!response || !response.transactions) {
        return empty;
    }

    const rootTxHash = response.trace?.txHash;
    if (!rootTxHash) return empty;

    const rootTx = response.transactions[rootTxHash];
    if (!rootTx) return empty;

    const ourAddress = rootTx.account;
    const ourTxs = Object.values(response.transactions).filter((tx) => tx.account === ourAddress);

    const outputs = ourTxs.reduce((acc, tx) => tx.outMsgs.reduce((a, m) => a + BigInt(m.value ?? 0), acc), 0n);

    const incomingTxes = options.skipFirstTxInput ? ourTxs.filter((t) => t.hash !== rootTx.hash) : ourTxs;
    const inputs = incomingTxes.reduce((acc, tx) => (tx.inMsg?.value ? acc + BigInt(tx.inMsg.value) : acc), 0n);

    const jettonTransfers: TransactionTraceMoneyFlowItem[] = [];

    for (const t of Object.values(response.transactions)) {
        if (!t.inMsg?.source) {
            continue;
        }

        const body = t.inMsg.messageContent.body;
        if (!body) {
            continue;
        }

        let parsed: RawJettonTransfer | null = null;
        try {
            parsed = parseJettonTransfer(Cell.fromBase64(body).beginParse());
        } catch (_) {
            continue;
        }
        if (!parsed) {
            continue;
        }
        const from = asMaybeAddressFriendly(t.inMsg.source);
        const to = parsed.destination instanceof Address ? parsed.destination : null;
        if (!to) {
            continue;
        }
        const jettonAmount = parsed.amount;

        let jettonMasterAddress: UserFriendlyAddress | undefined;
        try {
            jettonMasterAddress = await getJettonMasterAddressFromClient(client, t.account);
        } catch (_) {
            continue;
        }
        if (!jettonMasterAddress) {
            continue;
        }

        jettonTransfers.push({
            fromAddress: from ?? undefined,
            toAddress: asMaybeAddressFriendly(to.toString()) ?? undefined,
            tokenAddress: jettonMasterAddress ?? undefined,
            amount: jettonAmount.toString(),
            assetType: AssetType.jetton,
        });
    }

    const selfTransfers: TransactionTraceMoneyFlowItem[] = [];
    const ourJettonTransfersByAddress = jettonTransfers.reduce<Record<string, bigint>>((acc, transfer) => {
        if (transfer.assetType !== AssetType.jetton) {
            return acc;
        }
        const jettonKey = transfer.tokenAddress?.toString() || 'unknown';

        // TON Proxy
        if (TON_PROXY_ADDRESSES.has(jettonKey)) {
            return acc;
        }

        const rawKey = Address.parse(jettonKey).toRawString().toUpperCase();
        if (!acc[rawKey]) {
            acc[rawKey] = 0n;
        }

        // Add to balance if receiving tokens (to our address)
        // Subtract from balance if sending tokens (from our address)
        if (ourAddress && transfer.toAddress === ourAddress.toString()) {
            acc[rawKey] += BigInt(transfer.amount);
        }
        if (ourAddress && transfer.fromAddress === ourAddress.toString()) {
            acc[rawKey] -= BigInt(transfer.amount);
        }

        return acc;
    }, {});

    const ourJettonTransfers: TransactionTraceMoneyFlowItem[] = Object.entries(ourJettonTransfersByAddress).map(
        ([jettonKey, amount]) => ({
            assetType: AssetType.jetton,
            tokenAddress: asMaybeAddressFriendly(jettonKey) ?? undefined,
            amount: amount.toString(),
        }),
    );
    selfTransfers.push({
        assetType: AssetType.ton,
        amount: (BigInt(inputs) - BigInt(outputs)).toString(),
    });
    selfTransfers.push(...ourJettonTransfers);

    return {
        outputs: outputs.toString(),
        inputs: inputs.toString(),
        allJettonTransfers: jettonTransfers,
        ourTransfers: [{ assetType: AssetType.ton, amount: (inputs - outputs).toString() }, ...ourJettonTransfers],
        ourAddress,
    };
}
