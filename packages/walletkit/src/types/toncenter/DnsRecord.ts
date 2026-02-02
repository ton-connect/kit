/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { UserFriendlyAddress } from '../../api/models';

export interface DnsRecord {
    dnsNextResolver: string | null;
    dnsSiteAdnl: string | null;
    dnsStorageBagId: string | null;
    dnsWallet: UserFriendlyAddress | null;
    domain: string;
    nftItemAddress: UserFriendlyAddress;
    nftItemOwner: UserFriendlyAddress;
}
