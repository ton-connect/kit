/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { DnsRecord } from '../DnsRecord';
import { asAddressFriendly, asMaybeAddressFriendly } from '../../../utils/address';

export interface DNSRecordV3 {
    dns_next_resolver: string | null;
    dns_site_adnl: string | null;
    dns_storage_bag_id: string | null;
    dns_wallet: string | null;
    domain: string;
    nft_item_address: string;
    nft_item_owner: string;
}

export function toDnsRecord(data: DNSRecordV3): DnsRecord {
    return {
        dnsNextResolver: data.dns_next_resolver,
        dnsSiteAdnl: data.dns_site_adnl,
        dnsStorageBagId: data.dns_storage_bag_id,
        dnsWallet: asMaybeAddressFriendly(data.dns_wallet),
        domain: data.domain,
        nftItemAddress: asAddressFriendly(data.nft_item_address),
        nftItemOwner: asAddressFriendly(data.nft_item_owner),
    };
}
