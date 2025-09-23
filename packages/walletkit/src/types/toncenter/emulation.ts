// Types for Toncenter emulation endpoint response

// Root response
export interface ToncenterEmulationResponse {
    mc_block_seqno: number;
    trace: EmulationTraceNode;
    transactions: Record<string, ToncenterTransaction>;
    actions: EmulationAction[];
    code_cells: Record<string, string>; // base64-encoded cells by code hash
    data_cells: Record<string, string>; // base64-encoded cells by data hash
    address_book: Record<string, EmulationAddressBookEntry>;
    metadata: Record<string, EmulationAddressMetadata>;
    rand_seed: string;
    is_incomplete: boolean;
}

export interface ToncenterTransactionsResponse {
    transactions: ToncenterTransaction[];
    address_book: Record<string, EmulationAddressBookEntry>;
}

// Trace tree
export interface EmulationTraceNode {
    tx_hash: string;
    in_msg_hash: string | null;
    children: EmulationTraceNode[];
}

// Transactions map value (for emulation endpoint)
export interface ToncenterTransaction {
    account: string;
    hash: string;
    lt: string;
    now: number;
    mc_block_seqno: number;
    trace_external_hash: string;
    prev_trans_hash: string | null;
    prev_trans_lt: string | null;
    orig_status: EmulationAccountStatus | string;
    end_status: EmulationAccountStatus | string;
    total_fees: string;
    total_fees_extra_currencies: Record<string, string>;
    description: EmulationTransactionDescription;
    block_ref: EmulationBlockRef;
    in_msg: EmulationMessage | null;
    out_msgs: EmulationMessage[];
    account_state_before: EmulationAccountState;
    account_state_after: EmulationAccountState;
    emulated: boolean;
}

export type EmulationAccountStatus = 'active' | 'frozen' | 'uninit';

export interface EmulationBlockRef {
    workchain: number;
    shard: string;
    seqno: number;
}

export interface EmulationTransactionDescription {
    type: string; // e.g. "ord"
    aborted: boolean;
    destroyed: boolean;
    credit_first: boolean;
    is_tock: boolean;
    installed: boolean;
    storage_ph: {
        storage_fees_collected: string;
        status_change: 'unchanged' | string;
    };
    credit_ph?: {
        credit: string;
    };
    compute_ph: {
        skipped: boolean;
        success: boolean;
        msg_state_used: boolean;
        account_activated: boolean;
        gas_fees: string;
        gas_used: string;
        gas_limit: string;
        gas_credit?: string;
        mode: number;
        exit_code: number;
        vm_steps: number;
        vm_init_state_hash: string;
        vm_final_state_hash: string;
    };
    action: {
        success: boolean;
        valid: boolean;
        no_funds: boolean;
        status_change: 'unchanged' | string;
        total_fwd_fees?: string;
        total_action_fees?: string;
        result_code: number;
        tot_actions: number;
        spec_actions: number;
        skipped_actions: number;
        msgs_created: number;
        action_list_hash: string;
        tot_msg_size: {
            cells: string;
            bits: string;
        };
    };
}

export interface EmulationMessage {
    hash: string;
    source: string | null;
    destination: string;
    value: string | null;
    value_extra_currencies: Record<string, string>;
    fwd_fee: string | null;
    ihr_fee: string | null;
    created_lt: string | null;
    created_at: string | null;
    opcode: string | null;
    ihr_disabled: boolean | null;
    bounce: boolean | null;
    bounced: boolean | null;
    import_fee: string | null;
    message_content: {
        hash: string;
        body: string; // base64-encoded body
        decoded: unknown | null;
    };
    init_state: unknown | null;
    hash_norm?: string; // present on external message in some responses
}

export interface EmulationAccountState {
    hash: string;
    balance: string;
    extra_currencies: Record<string, string> | null;
    account_status: EmulationAccountStatus | string;
    frozen_hash: string | null;
    data_hash: string | null;
    code_hash: string | null;
}

// Actions
export type EmulationActionType = 'jetton_swap' | 'call_contract' | string;

export interface EmulationActionBase {
    trace_id: string | null;
    action_id: string;
    start_lt: string;
    end_lt: string;
    start_utime: number;
    end_utime: number;
    trace_end_lt: string;
    trace_end_utime: number;
    trace_mc_seqno_end: number;
    transactions: string[]; // list of tx hashes in this action
    success: boolean;
    type: EmulationActionType;
    trace_external_hash: string;
    accounts: string[];
}

export interface EmulationJettonSwapDetails {
    dex: string; // e.g. "stonfi"
    sender: string; // address
    asset_in: string; // jetton master
    asset_out: string; // jetton master
    dex_incoming_transfer: {
        asset: string;
        source: string;
        destination: string;
        source_jetton_wallet: string | null;
        destination_jetton_wallet: string | null;
        amount: string;
    };
    dex_outgoing_transfer: {
        asset: string;
        source: string;
        destination: string;
        source_jetton_wallet: string | null;
        destination_jetton_wallet: string | null;
        amount: string;
    };
    peer_swaps: unknown[];
}

export interface EmulationCallContractDetails {
    opcode: string;
    source: string;
    destination: string;
    value: string;
    extra_currencies: Record<string, string> | null;
}

export type EmulationActionDetails =
    | EmulationJettonSwapDetails
    | EmulationCallContractDetails
    | Record<string, unknown>; // fallback for unknown action types

export interface EmulationAction extends EmulationActionBase {
    details: EmulationActionDetails;
}

// Address book
export interface EmulationAddressBookEntry {
    user_friendly: string;
    domain: string | null;
}

// Metadata by address
export interface EmulationAddressMetadata {
    is_indexed: boolean;
    token_info?: EmulationTokenInfo[];
}

export type EmulationTokenInfo =
    | EmulationTokenInfoWallets
    | EmulationTokenInfoMasters
    | (EmulationTokenInfoBase & Record<string, unknown>);

export interface EmulationTokenInfoBase {
    valid: boolean;
    type: string;
}

export interface EmulationTokenInfoWallets extends EmulationTokenInfoBase {
    type: 'jetton_wallets';
    extra: {
        balance: string;
        jetton: string; // jetton master address
        owner: string; // owner address
    };
}

export interface EmulationTokenInfoMasters extends EmulationTokenInfoBase {
    type: 'jetton_masters';
    name: string;
    symbol: string;
    description: string;
    image?: string;
    extra: {
        _image_big?: string;
        _image_medium?: string;
        _image_small?: string;
        decimals: string | number;
        image_data?: string; // base64 encoded image data
        social?: string[];
        uri?: string;
        websites?: string[];
        [key: string]: unknown;
    };
}

// Toncenter Jetton Wallets API Response Types
export interface ToncenterResponseJettonWallets {
    jetton_wallets: ToncenterJettonWallet[];
    address_book: Record<string, EmulationAddressBookEntry>;
    metadata: Record<string, EmulationAddressMetadata>;
}

export interface ToncenterJettonWallet {
    address: string;
    balance: string;
    owner: string;
    jetton: string;
    last_transaction_lt: string;
    code_hash: string;
    data_hash: string;
}
