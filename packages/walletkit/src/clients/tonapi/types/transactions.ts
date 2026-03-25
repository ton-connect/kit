/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export interface TonApiTransactionsResponse {
    transactions: TonApiTransaction[];
}

export interface TonApiExtraCurrency {
    id: number | string;
    amount: string | number;
}

export interface TonApiMessage {
    hash: string;
    source?: { address: string };
    destination?: { address: string };
    value?: string | number | null;
    value_extra?: TonApiExtraCurrency[];
    fwd_fee?: string | number | null;
    ihr_fee?: string | number | null;
    created_lt?: string | number | null;
    created_at?: string | number | null;
    op_code?: string | null;
    ihr_disabled?: boolean | null;
    bounce?: boolean | null;
    bounced?: boolean | null;
    import_fee?: string | number | null;
    decoded_body?: unknown;
}

export interface TonApiPhaseStorage {
    storage_fees_collected?: string | number;
    status_change?: string;
}

export interface TonApiPhaseCredit {
    credit?: string | number;
}

export interface TonApiPhaseCompute {
    skipped?: boolean;
    success?: boolean;
    gas_fees?: string | number;
    gas_used?: string | number;
    exit_code?: number;
    vm_steps?: number;
}

export interface TonApiPhaseAction {
    success?: boolean;
    fwd_fees?: string | number;
    total_fees?: string | number;
    result_code?: number;
    total_actions?: number;
    skipped_actions?: number;
}

export interface TonApiTransaction {
    hash: string;
    lt: string | number;
    account: { address: string };
    end_balance?: string | number;
    success?: boolean;
    utime?: number;
    orig_status?: string;
    end_status?: string;
    total_fees?: string | number;
    transaction_type?: string;
    state_update_old?: string;
    state_update_new?: string;
    out_msgs?: TonApiMessage[];
    in_msg?: TonApiMessage;
    prev_trans_hash?: string | null;
    prev_trans_lt?: string | number | null;
    block?: string;
    aborted?: boolean;
    destroyed?: boolean;
    raw?: string;
    storage_phase?: TonApiPhaseStorage;
    credit_phase?: TonApiPhaseCredit;
    compute_phase?: TonApiPhaseCompute;
    action_phase?: TonApiPhaseAction;
}
