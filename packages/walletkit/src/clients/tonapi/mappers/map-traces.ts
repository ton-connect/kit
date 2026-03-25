/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
    EmulationTraceNode,
    ToncenterTracesResponse,
    ToncenterTransaction,
} from '../../../types/toncenter/emulation';
import type { TonApiMessage, TonApiTransaction } from '../types/transactions';
import type { TonApiTrace } from '../types/traces';
import { parseBlockRef } from './map-transactions';

export function mapTraceStatus(status: string | undefined): 'active' | 'frozen' | 'uninit' | string {
    if (!status || status === 'nonexist') {
        return 'uninit';
    }
    if (status === 'active' || status === 'frozen' || status === 'uninit') {
        return status;
    }
    return status;
}

export function flattenTrace(trace: TonApiTrace): TonApiTransaction[] {
    const out: TonApiTransaction[] = [trace.transaction];
    for (const child of trace.children ?? []) {
        out.push(...flattenTrace(child));
    }
    return out;
}

export function mapTonApiTraceNode(trace: TonApiTrace): EmulationTraceNode {
    return {
        tx_hash: trace.transaction.hash,
        in_msg_hash: trace.transaction.in_msg?.hash ?? null,
        children: (trace.children ?? []).map((child) => mapTonApiTraceNode(child)),
    };
}

export function mapTonApiTraceMessage(raw: TonApiMessage) {
    const extraCurrencies: Record<string, string> = {};
    for (const currency of raw.value_extra ?? []) {
        extraCurrencies[String(currency.id)] = String(currency.amount ?? 0);
    }

    return {
        hash: raw.hash ?? '',
        source: raw.source?.address ?? null,
        destination: raw.destination?.address ?? '',
        value: raw.value !== undefined && raw.value !== null ? String(raw.value) : null,
        value_extra_currencies: extraCurrencies,
        fwd_fee: raw.fwd_fee !== undefined && raw.fwd_fee !== null ? String(raw.fwd_fee) : null,
        ihr_fee: raw.ihr_fee !== undefined && raw.ihr_fee !== null ? String(raw.ihr_fee) : null,
        created_lt: raw.created_lt !== undefined && raw.created_lt !== null ? String(raw.created_lt) : null,
        created_at: raw.created_at !== undefined && raw.created_at !== null ? String(raw.created_at) : null,
        opcode: raw.op_code ?? null,
        ihr_disabled: raw.ihr_disabled ?? null,
        bounce: raw.bounce ?? null,
        bounced: raw.bounced ?? null,
        import_fee: raw.import_fee !== undefined && raw.import_fee !== null ? String(raw.import_fee) : null,
        message_content: {
            hash: '',
            body: '',
            decoded: raw.decoded_body ?? null,
        },
        init_state: null,
        hash_norm: undefined,
    };
}

export function mapTonApiTraceTransaction(raw: TonApiTransaction): ToncenterTransaction {
    const blockRef = parseBlockRef(raw.block);
    const inMsg = raw.in_msg ? mapTonApiTraceMessage(raw.in_msg) : null;
    const outMsgs = (raw.out_msgs ?? []).map((message) => mapTonApiTraceMessage(message));

    return {
        account: raw.account.address,
        hash: raw.hash,
        lt: String(raw.lt ?? 0),
        now: Number(raw.utime ?? 0),
        mc_block_seqno: blockRef.seqno,
        trace_external_hash: raw.hash,
        prev_trans_hash: raw.prev_trans_hash ?? null,
        prev_trans_lt: raw.prev_trans_lt !== undefined && raw.prev_trans_lt !== null ? String(raw.prev_trans_lt) : null,
        orig_status: mapTraceStatus(raw.orig_status),
        end_status: mapTraceStatus(raw.end_status),
        total_fees: String(raw.total_fees ?? 0),
        total_fees_extra_currencies: {},
        description: {
            type: raw.transaction_type ?? 'ord',
            aborted: raw.aborted ?? !(raw.success ?? true),
            destroyed: raw.destroyed ?? false,
            credit_first: false,
            is_tock: false,
            installed: false,
            storage_ph: {
                storage_fees_collected: String(raw.storage_phase?.storage_fees_collected ?? 0),
                status_change: raw.storage_phase?.status_change ?? 'unchanged',
            },
            credit_ph:
                raw.credit_phase?.credit !== undefined && raw.credit_phase?.credit !== null
                    ? { credit: String(raw.credit_phase.credit) }
                    : undefined,
            compute_ph: {
                skipped: raw.compute_phase?.skipped ?? false,
                success: raw.compute_phase?.success ?? raw.success ?? true,
                msg_state_used: false,
                account_activated: false,
                gas_fees: String(raw.compute_phase?.gas_fees ?? 0),
                gas_used: String(raw.compute_phase?.gas_used ?? 0),
                gas_limit: String(raw.compute_phase?.gas_used ?? 0),
                mode: 0,
                exit_code: raw.compute_phase?.exit_code ?? (raw.success ? 0 : 1),
                vm_steps: raw.compute_phase?.vm_steps ?? 0,
                vm_init_state_hash: '',
                vm_final_state_hash: '',
            },
            action: {
                success: raw.action_phase?.success ?? raw.success ?? true,
                valid: true,
                no_funds: false,
                status_change: 'unchanged',
                total_fwd_fees: String(raw.action_phase?.fwd_fees ?? 0),
                total_action_fees: String(raw.action_phase?.total_fees ?? 0),
                result_code: raw.action_phase?.result_code ?? 0,
                tot_actions: raw.action_phase?.total_actions ?? 0,
                spec_actions: 0,
                skipped_actions: raw.action_phase?.skipped_actions ?? 0,
                msgs_created: raw.out_msgs?.length ?? 0,
                action_list_hash: '',
                tot_msg_size: {
                    cells: '0',
                    bits: '0',
                },
            },
        },
        block_ref: {
            workchain: blockRef.workchain,
            shard: blockRef.shard,
            seqno: blockRef.seqno,
        },
        in_msg: inMsg,
        out_msgs: outMsgs,
        account_state_before: {
            hash: '',
            balance: String(raw.end_balance ?? 0),
            extra_currencies: null,
            account_status: mapTraceStatus(raw.orig_status),
            frozen_hash: null,
            data_hash: null,
            code_hash: null,
        },
        account_state_after: {
            hash: '',
            balance: String(raw.end_balance ?? 0),
            extra_currencies: null,
            account_status: mapTraceStatus(raw.end_status),
            frozen_hash: null,
            data_hash: null,
            code_hash: null,
        },
        emulated: false,
        trace_id: raw.hash,
    };
}

export function mapTonApiTrace(
    trace: TonApiTrace,
    mapTraceTransaction: (tx: TonApiTransaction) => ToncenterTransaction,
): ToncenterTracesResponse {
    const traceTransactions = flattenTrace(trace);
    const transactions = Object.fromEntries(traceTransactions.map((tx) => [tx.hash, mapTraceTransaction(tx)]));
    const transactionsOrder = [...traceTransactions]
        .sort((a, b) => (BigInt(a.lt ?? 0) < BigInt(b.lt ?? 0) ? -1 : 1))
        .map((tx) => tx.hash);

    const lts = traceTransactions.map((tx) => BigInt(tx.lt ?? 0));
    const times = traceTransactions.map((tx) => Number(tx.utime ?? 0));

    const startLt = lts.length > 0 ? lts.reduce((min, value) => (value < min ? value : min), lts[0]) : 0n;
    const endLt = lts.length > 0 ? lts.reduce((max, value) => (value > max ? value : max), lts[0]) : 0n;
    const startUtime = times.length > 0 ? Math.min(...times) : 0;
    const endUtime = times.length > 0 ? Math.max(...times) : 0;

    const traceId = trace.transaction.hash;
    const rootTx = mapTraceTransaction(trace.transaction);
    const messagesCount = traceTransactions.reduce(
        (acc, tx) => acc + (tx.in_msg ? 1 : 0) + (tx.out_msgs?.length ?? 0),
        0,
    );

    return {
        address_book: {},
        metadata: {},
        traces: [
            {
                actions: [],
                end_lt: endLt.toString(),
                end_utime: endUtime,
                external_hash: rootTx.in_msg?.hash ?? '',
                is_incomplete: false,
                mc_seqno_end: String(rootTx.mc_block_seqno ?? 0),
                mc_seqno_start: String(rootTx.mc_block_seqno ?? 0),
                start_lt: startLt.toString(),
                start_utime: startUtime,
                trace: mapTonApiTraceNode(trace),
                trace_id: traceId,
                trace_info: {
                    classification_state: 'tonapi',
                    messages: messagesCount,
                    pending_messages: 0,
                    trace_state: 'complete',
                    transactions: traceTransactions.length,
                },
                transactions,
                transactions_order: transactionsOrder,
                warning: '',
            },
        ],
    };
}
