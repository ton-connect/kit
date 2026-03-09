/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
    ToncenterTransaction,
    EmulationTransactionDescription,
    EmulationMessage,
    EmulationAccountState,
    EmulationBlockRef,
} from './emulation';
import type { AddressBookRowV3 } from './v3/AddressBookRowV3';

/**
 * Toncenter Streaming API v2 types.
 * @see https://gist.github.com/dungeon-master-666/98db8d73e9cd9a1b7802bc06ded5b155
 */

export type StreamingV2Finality = 'pending' | 'confirmed' | 'finalized';

export type StreamingV2EventType =
    | 'transactions'
    | 'actions'
    | 'trace'
    | 'account_state_change'
    | 'jettons_change'
    | 'trace_invalidated';

/** WebSocket subscribe message for v2 API */
export interface StreamingV2SubscriptionRequest {
    addresses?: string[];
    trace_external_hash_norms?: string[];
    types: StreamingV2EventType[];
    min_finality?: StreamingV2Finality;
    include_address_book?: boolean;
    include_metadata?: boolean;
    action_types?: string[];
    supported_action_types?: string[];
}

/** Account state from v2 API - fields may be null */
export interface StreamingV2AccountState {
    hash?: string | null;
    balance?: string | null;
    extra_currencies?: Record<string, string> | null;
    account_status?: string | null;
    frozen_hash?: string | null;
    data_hash?: string | null;
    code_hash?: string | null;
}

/** Raw transaction from v2 API - may have simplified compute_ph when skipped */
export interface StreamingV2TransactionRaw {
    account: string;
    hash: string;
    lt: string;
    now: number;
    mc_block_seqno: number;
    trace_id?: string;
    prev_trans_hash: string | null;
    prev_trans_lt: string | null;
    orig_status: string;
    end_status: string;
    total_fees: string;
    total_fees_extra_currencies?: Record<string, string>;
    description: StreamingV2TransactionDescription;
    block_ref: EmulationBlockRef;
    in_msg: EmulationMessage | null;
    out_msgs: EmulationMessage[];
    account_state_before: StreamingV2AccountState;
    account_state_after: StreamingV2AccountState;
    emulated?: boolean;
    finality?: StreamingV2Finality;
}

/** compute_ph can be full or simplified when skipped */
export interface StreamingV2ComputePhaseSkipped {
    skipped: true;
    reason: string;
}

export interface StreamingV2ComputePhaseFull {
    skipped: boolean;
    success: boolean;
    msg_state_used?: boolean;
    account_activated?: boolean;
    gas_fees?: string;
    gas_used?: string;
    gas_limit?: string;
    gas_credit?: string;
    mode?: number;
    exit_code?: number;
    vm_steps?: number;
    vm_init_state_hash?: string;
    vm_final_state_hash?: string;
}

export type StreamingV2ComputePhase = StreamingV2ComputePhaseSkipped | StreamingV2ComputePhaseFull;

export interface StreamingV2TransactionDescription {
    type: string;
    aborted: boolean;
    destroyed: boolean;
    credit_first: boolean;
    is_tock: boolean;
    installed: boolean;
    storage_ph: {
        storage_fees_collected: string;
        status_change: string;
    };
    credit_ph?: { credit: string };
    compute_ph: StreamingV2ComputePhase;
    action?: {
        success: boolean;
        valid?: boolean;
        no_funds?: boolean;
        status_change?: string;
        total_fwd_fees?: string;
        total_action_fees?: string;
        result_code?: number;
        tot_actions?: number;
        spec_actions?: number;
        skipped_actions?: number;
        msgs_created?: number;
        action_list_hash?: string;
        tot_msg_size?: { cells: string; bits: string };
    };
}

/** TransactionsNotification from v2 */
export interface StreamingV2TransactionsNotification {
    type: 'transactions';
    finality: StreamingV2Finality;
    trace_external_hash_norm: string;
    transactions: StreamingV2TransactionRaw[];
    address_book?: Record<string, AddressBookRowV3>;
    metadata?: Record<string, unknown>;
}

/** ActionsNotification from v2 */
export interface StreamingV2ActionsNotification {
    type: 'actions';
    finality: StreamingV2Finality;
    trace_external_hash_norm: string;
    actions: unknown[];
    address_book?: Record<string, AddressBookRowV3>;
    metadata?: Record<string, unknown>;
}

/** AccountStateNotification from v2 */
export interface StreamingV2AccountStateNotification {
    type: 'account_state_change';
    finality: StreamingV2Finality;
    account: string;
    state: {
        hash: string;
        balance: string;
        account_status: string;
        data_hash: string;
        code_hash: string;
    };
}

/** Jetton wallet from v2 - same schema as API v3 */
export interface StreamingV2JettonWallet {
    address: string;
    balance: string;
    owner: string;
    jetton: string;
    last_transaction_lt: string;
    code_hash?: string;
    data_hash?: string;
}

/** JettonsNotification from v2 */
export interface StreamingV2JettonsNotification {
    type: 'jettons_change';
    finality: StreamingV2Finality;
    jetton: StreamingV2JettonWallet;
    address_book?: Record<string, AddressBookRowV3>;
    metadata?: Record<string, unknown>;
}

/** TraceInvalidatedNotification from v2 */
export interface StreamingV2TraceInvalidatedNotification {
    type: 'trace_invalidated';
    trace_external_hash_norm: string;
}

export type StreamingV2Event =
    | StreamingV2TransactionsNotification
    | StreamingV2ActionsNotification
    | StreamingV2AccountStateNotification
    | StreamingV2JettonsNotification
    | StreamingV2TraceInvalidatedNotification;

/** Default compute_ph for skipped transactions */
const DEFAULT_COMPUTE_PH_SKIPPED: EmulationTransactionDescription['compute_ph'] = {
    skipped: true,
    success: false,
    msg_state_used: false,
    account_activated: false,
    gas_fees: '0',
    gas_used: '0',
    gas_limit: '0',
    mode: 0,
    exit_code: 0,
    vm_steps: 0,
    vm_init_state_hash: '',
    vm_final_state_hash: '',
};

/** Default action for failed/skipped transactions */
const DEFAULT_ACTION: EmulationTransactionDescription['action'] = {
    success: false,
    valid: false,
    no_funds: false,
    status_change: 'unchanged',
    result_code: 0,
    tot_actions: 0,
    spec_actions: 0,
    skipped_actions: 0,
    msgs_created: 0,
    action_list_hash: '',
    tot_msg_size: { cells: '0', bits: '0' },
};

/**
 * Maps a v2 streaming transaction to ToncenterTransaction.
 * Handles simplified compute_ph when skipped and injects trace_external_hash from event.
 */
export function toToncenterTransaction(
    raw: StreamingV2TransactionRaw,
    traceExternalHashNorm: string,
): ToncenterTransaction {
    const computePh = raw.description.compute_ph;
    const isSkipped = 'skipped' in computePh && computePh.skipped;

    const fullComputePh: EmulationTransactionDescription['compute_ph'] = isSkipped
        ? DEFAULT_COMPUTE_PH_SKIPPED
        : {
              skipped: computePh.skipped,
              success: computePh.success,
              msg_state_used: computePh.msg_state_used ?? false,
              account_activated: computePh.account_activated ?? false,
              gas_fees: computePh.gas_fees ?? '0',
              gas_used: computePh.gas_used ?? '0',
              gas_limit: computePh.gas_limit ?? '0',
              gas_credit: computePh.gas_credit,
              mode: computePh.mode ?? 0,
              exit_code: computePh.exit_code ?? 0,
              vm_steps: computePh.vm_steps ?? 0,
              vm_init_state_hash: computePh.vm_init_state_hash ?? '',
              vm_final_state_hash: computePh.vm_final_state_hash ?? '',
          };

    const action = raw.description.action ?? DEFAULT_ACTION;

    const fullDescription: EmulationTransactionDescription = {
        type: raw.description.type,
        aborted: raw.description.aborted,
        destroyed: raw.description.destroyed,
        credit_first: raw.description.credit_first,
        is_tock: raw.description.is_tock,
        installed: raw.description.installed,
        storage_ph: raw.description.storage_ph,
        credit_ph: raw.description.credit_ph,
        compute_ph: fullComputePh,
        action: {
            success: action.success,
            valid: action.valid ?? false,
            no_funds: action.no_funds ?? false,
            status_change: action.status_change ?? 'unchanged',
            total_fwd_fees: action.total_fwd_fees,
            total_action_fees: action.total_action_fees,
            result_code: action.result_code ?? 0,
            tot_actions: action.tot_actions ?? 0,
            spec_actions: action.spec_actions ?? 0,
            skipped_actions: action.skipped_actions ?? 0,
            msgs_created: action.msgs_created ?? 0,
            action_list_hash: action.action_list_hash ?? '',
            tot_msg_size: action.tot_msg_size ?? { cells: '0', bits: '0' },
        },
    };

    const normalizeAccountState = (s: StreamingV2AccountState): EmulationAccountState => ({
        hash: s.hash ?? '',
        balance: s.balance ?? '0',
        extra_currencies: s.extra_currencies ?? null,
        account_status: s.account_status ?? 'active',
        frozen_hash: s.frozen_hash ?? null,
        data_hash: s.data_hash ?? null,
        code_hash: s.code_hash ?? null,
    });

    return {
        account: raw.account,
        hash: raw.hash,
        lt: raw.lt,
        now: raw.now,
        mc_block_seqno: raw.mc_block_seqno,
        trace_external_hash: traceExternalHashNorm,
        prev_trans_hash: raw.prev_trans_hash,
        prev_trans_lt: raw.prev_trans_lt,
        orig_status: raw.orig_status,
        end_status: raw.end_status,
        total_fees: raw.total_fees,
        total_fees_extra_currencies: raw.total_fees_extra_currencies ?? {},
        description: fullDescription,
        block_ref: raw.block_ref,
        in_msg: raw.in_msg,
        out_msgs: raw.out_msgs ?? [],
        account_state_before: normalizeAccountState(raw.account_state_before),
        account_state_after: normalizeAccountState(raw.account_state_after),
        emulated: raw.emulated ?? false,
        trace_id: raw.trace_id,
    };
}
