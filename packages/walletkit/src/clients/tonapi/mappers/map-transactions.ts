/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { asAddressFriendly } from '../../../utils/address';
import type { TonApiMessage, TonApiTransaction } from '../types/transactions';
import type { Hex, Transaction, TransactionDescription, TransactionMessage } from '../../../api/models';
import { Base64Normalize, Base64ToHex, isHex } from '../../../utils';

export function toHex(value: string): Hex {
    const normalized = value.trim();
    if (!normalized) {
        throw new Error('Invalid hex value: empty input');
    }

    if (isHex(normalized)) {
        return normalized.toLowerCase() as Hex;
    }

    if (/^[0-9a-fA-F]+$/.test(normalized) && normalized.length % 2 === 0) {
        return `0x${normalized.toLowerCase()}` as Hex;
    }

    try {
        return Base64ToHex(Base64Normalize(normalized)).toLowerCase() as Hex;
    } catch {
        // fallthrough
    }

    throw new Error(`Invalid hex value: ${value}`);
}

export function parseBlockRef(block: string | undefined): { workchain: number; shard: string; seqno: number } {
    if (!block) {
        return { workchain: 0, shard: '', seqno: 0 };
    }

    const matches = block.match(/\(\s*(-?\d+)\s*,\s*([^,]+)\s*,\s*(-?\d+)\s*\)/);
    if (!matches) {
        return { workchain: 0, shard: block, seqno: 0 };
    }

    const workchain = Number(matches[1]);
    const seqno = Number(matches[3]);

    return {
        workchain: Number.isFinite(workchain) ? workchain : 0,
        shard: matches[2].trim(),
        seqno: Number.isFinite(seqno) ? seqno : 0,
    };
}

export function toAccountStatus(
    status: string | undefined,
): { type: 'active' } | { type: 'frozen' } | { type: 'uninit' } | { type: 'unknown'; value: string } | undefined {
    if (!status) return undefined;
    if (status === 'active') return { type: 'active' };
    if (status === 'frozen') return { type: 'frozen' };
    if (status === 'uninit') return { type: 'uninit' };
    if (status === 'nonexist') return { type: 'unknown', value: 'nonexist' };
    return { type: 'unknown', value: status };
}

export function mapTonApiMessage(raw: TonApiMessage): TransactionMessage {
    const extra: Record<number, string> = {};
    for (const currency of raw.value_extra ?? []) {
        extra[Number(currency.id)] = String(currency.amount ?? 0);
    }

    return {
        hash: toHex(raw.hash),
        source: raw.source ? asAddressFriendly(raw.source.address) : undefined,
        destination: raw.destination ? asAddressFriendly(raw.destination.address) : undefined,
        value: raw.value !== undefined && raw.value !== null ? String(raw.value) : undefined,
        valueExtraCurrencies: extra,
        fwdFee: raw.fwd_fee !== undefined && raw.fwd_fee !== null ? String(raw.fwd_fee) : undefined,
        ihrFee: raw.ihr_fee !== undefined && raw.ihr_fee !== null ? String(raw.ihr_fee) : undefined,
        creationLogicalTime:
            raw.created_lt !== undefined && raw.created_lt !== null ? String(raw.created_lt) : undefined,
        createdAt: raw.created_at ? Number(raw.created_at) : undefined,
        opcode: raw.op_code ?? undefined,
        ihrDisabled: raw.ihr_disabled ?? undefined,
        isBounce: raw.bounce ?? undefined,
        isBounced: raw.bounced ?? undefined,
        importFee: raw.import_fee !== undefined && raw.import_fee !== null ? String(raw.import_fee) : undefined,
        messageContent: {
            body: undefined,
            decoded: raw.decoded_body,
        },
    };
}

export function mapTonApiDescription(raw: TonApiTransaction): TransactionDescription {
    return {
        type: raw.transaction_type ?? 'ord',
        isAborted: raw.aborted ?? !(raw.success ?? true),
        isDestroyed: raw.destroyed ?? false,
        isCreditFirst: false,
        isTock: false,
        isInstalled: false,
        storagePhase: {
            storageFeesCollected: String(raw.storage_phase?.storage_fees_collected ?? 0),
            statusChange: raw.storage_phase?.status_change ?? 'unchanged',
        },
        creditPhase:
            raw.credit_phase?.credit !== undefined && raw.credit_phase?.credit !== null
                ? {
                      credit: String(raw.credit_phase.credit),
                  }
                : undefined,
        computePhase: {
            isSkipped: raw.compute_phase?.skipped ?? false,
            isSuccess: raw.compute_phase?.success ?? raw.success ?? true,
            isMessageStateUsed: false,
            isAccountActivated: false,
            gasFees: String(raw.compute_phase?.gas_fees ?? 0),
            gasUsed: String(raw.compute_phase?.gas_used ?? 0),
            gasLimit: String(raw.compute_phase?.gas_used ?? 0),
            mode: 0,
            exitCode: raw.compute_phase?.exit_code ?? (raw.success ? 0 : 1),
            vmStepsNumber: raw.compute_phase?.vm_steps ?? 0,
        },
        action: {
            isSuccess: raw.action_phase?.success ?? raw.success ?? true,
            isValid: true,
            hasNoFunds: false,
            statusChange: 'unchanged',
            totalForwardingFees: String(raw.action_phase?.fwd_fees ?? 0),
            totalActionFees: String(raw.action_phase?.total_fees ?? 0),
            resultCode: raw.action_phase?.result_code ?? 0,
            totalActionsNumber: raw.action_phase?.total_actions ?? 0,
            specActionsNumber: 0,
            skippedActionsNumber: raw.action_phase?.skipped_actions ?? 0,
            messagesCreatedNumber: raw.out_msgs?.length ?? 0,
            totalMessagesSize: {
                cells: '0',
                bits: '0',
            },
        },
    };
}

export function mapTonApiTransaction(raw: TonApiTransaction): Transaction {
    const blockRef = parseBlockRef(raw.block);

    return {
        account: asAddressFriendly(raw.account.address),
        hash: toHex(raw.hash),
        logicalTime: String(raw.lt),
        now: Number(raw.utime ?? 0),
        mcBlockSeqno: blockRef.seqno,
        traceExternalHash: toHex(raw.hash),
        previousTransactionHash: raw.prev_trans_hash || undefined,
        previousTransactionLogicalTime:
            raw.prev_trans_lt !== undefined && raw.prev_trans_lt !== null ? String(raw.prev_trans_lt) : undefined,
        origStatus: toAccountStatus(raw.orig_status),
        endStatus: toAccountStatus(raw.end_status),
        totalFees: String(raw.total_fees ?? 0),
        totalFeesExtraCurrencies: {},
        blockRef,
        inMessage: raw.in_msg ? mapTonApiMessage(raw.in_msg) : undefined,
        outMessages: (raw.out_msgs ?? []).map((message) => mapTonApiMessage(message)),
        description: mapTonApiDescription(raw),
        isEmulated: false,
    };
}
