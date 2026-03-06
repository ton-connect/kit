/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export interface TonApiDnsResolveResponse {
    wallet?: {
        address: string;
        account: {
            address: string;
            name?: string;
            is_scam: boolean;
            is_wallet: boolean;
        };
        is_wallet: boolean;
        has_method_pubkey: boolean;
        has_method_seqno: boolean;
        names: string[];
    };
    next_resolver?: string;
    sites: string[];
    storage?: string;
}

export interface TonApiDnsBackresolveResponse {
    domains: string[];
}
