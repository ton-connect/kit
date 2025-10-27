/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { AddressFriendly } from '../primitive';

export interface DnsRecord {
    dnsNextResolver: string | null;
    dnsSiteAdnl: string | null;
    dnsStorageBagId: string | null;
    dnsWallet: AddressFriendly | null;
    domain: string;
    nftItemAddress: AddressFriendly;
    nftItemOwner: AddressFriendly;
}
