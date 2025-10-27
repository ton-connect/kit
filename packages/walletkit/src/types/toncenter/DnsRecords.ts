/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { AddressBookRow } from './AddressBookRow';
import { DnsRecord } from './DnsRecord';

export interface DnsRecords {
    addressBook: { [key: string]: AddressBookRow };
    records: DnsRecord[];
}
