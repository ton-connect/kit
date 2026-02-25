/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export interface TonApiDnsResolveResponse {
    name: string;
    expiring_at?: number;
    item: {
        address: string;
        index: number;
        verified: boolean;
        owner: {
            address: string;
            is_scam: boolean;
            is_wallet: boolean;
            icon?: string;
            name?: string;
        };
        collection?: {
            address?: string;
            name?: string;
            description?: string;
        };
        metadata: {
            image?: string;
            buttons?: { label: string; uri: string }[];
            description?: string;
            name?: string;
        };
        previews: { resolution: string; url: string }[];
        dns: string;
        approved_by: string[];
        trust: string;
    };
}

export interface TonApiDnsBackresolveResponse {
    domains: string[];
}
