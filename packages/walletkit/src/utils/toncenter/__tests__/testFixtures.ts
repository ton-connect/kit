/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { vi } from 'vitest';
import type { Mock } from 'vitest';

import type { ToncenterTransaction, ToncenterTracesResponse } from '../../../types/toncenter/emulation';
import type { ApiClient } from '../../../types/toncenter/ApiClient';

export const JETTON_TRANSFER = '0x0f8a7ea5';
export const JETTON_NOTIFY = '0x7362d09c';
export const EXCESS = '0xd53276db';
export const UNKNOWN = '0xffffffff';

/** Build a minimal ToncenterTransaction. Succeeds by default. */
export function makeTx(opcode: string | null = null, failed = false): ToncenterTransaction {
    return {
        account: 'addr',
        hash: 'hash',
        lt: '0',
        now: 0,
        mc_block_seqno: 0,
        trace_external_hash: 'ext',
        prev_trans_hash: null,
        prev_trans_lt: null,
        orig_status: 'active',
        end_status: 'active',
        total_fees: '0',
        total_fees_extra_currencies: {},
        block_ref: { workchain: 0, shard: '0', seqno: 0 },
        in_msg: opcode
            ? {
                  hash: 'h',
                  source: null,
                  destination: 'dest',
                  value: null,
                  value_extra_currencies: {},
                  fwd_fee: null,
                  ihr_fee: null,
                  created_lt: null,
                  created_at: null,
                  opcode,
                  ihr_disabled: null,
                  bounce: null,
                  bounced: null,
                  import_fee: null,
                  message_content: { hash: 'h', body: '', decoded: null },
                  init_state: null,
              }
            : null,
        out_msgs: [],
        account_state_before: {
            hash: 'h',
            balance: '0',
            extra_currencies: null,
            account_status: 'active',
            frozen_hash: null,
            data_hash: null,
            code_hash: null,
        },
        account_state_after: {
            hash: 'h',
            balance: '0',
            extra_currencies: null,
            account_status: 'active',
            frozen_hash: null,
            data_hash: null,
            code_hash: null,
        },
        emulated: false,
        description: {
            type: 'ord',
            aborted: failed,
            destroyed: false,
            credit_first: false,
            is_tock: false,
            installed: false,
            storage_ph: { storage_fees_collected: '0', status_change: 'unchanged' },
            compute_ph: {
                skipped: false,
                success: !failed,
                msg_state_used: false,
                account_activated: false,
                gas_fees: '0',
                gas_used: '0',
                gas_limit: '0',
                mode: 0,
                exit_code: failed ? 1 : 0,
                vm_steps: 0,
                vm_init_state_hash: '',
                vm_final_state_hash: '',
            },
            action: {
                success: !failed,
                valid: true,
                no_funds: false,
                status_change: 'unchanged',
                result_code: 0,
                tot_actions: 0,
                spec_actions: 0,
                skipped_actions: 0,
                msgs_created: 0,
                action_list_hash: '',
                tot_msg_size: { cells: '0', bits: '0' },
            },
        },
    };
}

// ---------------------------------------------------------------------------
// Trace response fixtures
// ---------------------------------------------------------------------------

/** Build a ToncenterTracesResponse with optional field overrides. */
export function makeTrace(
    overrides: {
        trace_state?: 'complete' | 'pending';
        messages?: number;
        pending_messages?: number;
        transactions?: ToncenterTracesResponse['traces'][number]['transactions'];
    } = {},
): ToncenterTracesResponse {
    const traceState = overrides.trace_state ?? 'complete';
    return {
        address_book: {},
        metadata: {},
        traces: [
            {
                trace_info: {
                    classification_state: 'ok',
                    messages: overrides.messages ?? 2,
                    pending_messages: overrides.pending_messages ?? 0,
                    trace_state: traceState,
                    transactions: 1,
                },
                transactions: overrides.transactions ?? {},
                actions: [],
                end_lt: '0',
                end_utime: 0,
                external_hash: 'ext',
                is_incomplete: false,
                mc_seqno_end: '0',
                mc_seqno_start: '0',
                start_lt: '0',
                start_utime: 0,
                trace: { tx_hash: 'root', in_msg_hash: null, children: [] },
                trace_id: 'tid',
                transactions_order: [],
                warning: '',
            },
        ],
    };
}

/** Empty ToncenterTracesResponse (no traces found). */
export function makeEmptyTrace(): ToncenterTracesResponse {
    return { address_book: {}, metadata: {}, traces: [] };
}

/** Build a minimal ApiClient mock. Only getPendingTrace and getTrace are real by default. */
export function makeClient(overrides?: { getPendingTrace?: Mock; getTrace?: Mock }): ApiClient {
    return {
        getPendingTrace: overrides?.getPendingTrace ?? vi.fn().mockResolvedValue(makeEmptyTrace()),
        getTrace: overrides?.getTrace ?? vi.fn().mockResolvedValue(makeEmptyTrace()),
        nftItemsByAddress: vi.fn(),
        nftItemsByOwner: vi.fn(),
        fetchEmulation: vi.fn(),
        sendBoc: vi.fn(),
        runGetMethod: vi.fn(),
        getAccountState: vi.fn(),
        getBalance: vi.fn(),
        getAccountTransactions: vi.fn(),
        getTransactionsByHash: vi.fn(),
        getPendingTransactions: vi.fn(),
        resolveDnsWallet: vi.fn(),
        backResolveDnsWallet: vi.fn(),
        jettonsByAddress: vi.fn(),
        jettonsByOwnerAddress: vi.fn(),
        getEvents: vi.fn(),
    } as unknown as ApiClient;
}
