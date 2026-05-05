/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { EmulationBlockRef, EmulationMessage } from '../../../types/toncenter/emulation';
import type { AddressBookRowV3 } from '../../../types/toncenter/v3/AddressBookRowV3';
import type { TransactionAddressMetadata } from '../../../api/models';
import type { StreamingV2AccountState } from './account';
import type { StreamingV2Finality } from './core';

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

export interface StreamingV2TransactionsNotification {
    type: 'transactions';
    finality: StreamingV2Finality;
    trace_external_hash_norm: string;
    transactions: StreamingV2TransactionRaw[];
    address_book?: Record<string, AddressBookRowV3>;
    metadata?: TransactionAddressMetadata;
}

export interface StreamingV2TraceInvalidatedNotification {
    type: 'trace_invalidated';
    trace_external_hash_norm: string;
}
