/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

interface TonApiCurrencyCollection {
    grams: number;
    other: Array<{
        id: number;
        value: string;
    }>;
}

export interface TonApiMasterchainHeadResponse {
    tx_quantity: number;
    value_flow: {
        from_prev_blk: TonApiCurrencyCollection;
        to_next_blk: TonApiCurrencyCollection;
        imported: TonApiCurrencyCollection;
        exported: TonApiCurrencyCollection;
        fees_collected: TonApiCurrencyCollection;
        burned: TonApiCurrencyCollection;
        fees_imported: TonApiCurrencyCollection;
        recovered: TonApiCurrencyCollection;
        created: TonApiCurrencyCollection;
        minted: TonApiCurrencyCollection;
    };
    workchain_id: number;
    shard: string;
    seqno: number;
    root_hash: string;
    file_hash: string;
    global_id: number;
    version: number;
    after_merge: boolean;
    before_split: boolean;
    after_split: boolean;
    want_split: boolean;
    want_merge: boolean;
    key_block: boolean;
    gen_utime: number;
    start_lt: number;
    end_lt: number;
    vert_seqno: number;
    gen_catchain_seqno: number;
    min_ref_mc_seqno: number;
    prev_key_block_seqno: number;
    gen_software_version: number;
    gen_software_capabilities: number;
    prev_refs: string[];
    in_msg_descr_length: number;
    out_msg_descr_length: number;
    rand_seed: string;
    created_by: string;
}
