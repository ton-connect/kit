/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ToncenterTransaction, EmulationTraceNode } from '../../../types/toncenter/emulation';
import type { MetadataV3 } from '../../../types/toncenter/v3/AddressBookRowV3';

export interface ToncenterEmulationResponse extends MetadataV3 {
    mc_block_seqno: number;
    trace: EmulationTraceNode;
    transactions: Record<string, ToncenterTransaction>;
    actions: EmulationAction[];
    code_cells: Record<string, string>;
    data_cells: Record<string, string>;
    rand_seed: string;
    is_incomplete: boolean;
}

type EmulationActionType = 'jetton_swap' | 'call_contract' | string;

interface EmulationActionBase {
    trace_id: string | null;
    action_id: string;
    start_lt: string;
    end_lt: string;
    start_utime: number;
    end_utime: number;
    trace_end_lt: string;
    trace_end_utime: number;
    trace_mc_seqno_end: number;
    transactions: string[];
    success: boolean;
    type: EmulationActionType;
    trace_external_hash: string;
    accounts: string[];
}

export interface EmulationJettonSwapDetails {
    dex: string;
    sender: string;
    asset_in: string;
    asset_out: string;
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

export interface EmulationTonTransferDetails {
    source: string;
    destination: string;
    value: string;
    value_extra_currencies: Record<string, string>;
    comment: string | null;
    encrypted: boolean;
}

type EmulationActionDetails =
    | EmulationTonTransferDetails
    | EmulationJettonSwapDetails
    | EmulationCallContractDetails
    | Record<string, unknown>;

export interface EmulationAction extends EmulationActionBase {
    details: EmulationActionDetails;
}
