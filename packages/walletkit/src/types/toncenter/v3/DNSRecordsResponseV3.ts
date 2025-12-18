/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { DNSRecordV3 } from './DNSRecordV3';
import { toDnsRecord } from './DNSRecordV3';
import type { AddressBookRowV3 } from './AddressBookRowV3';
import type { DnsRecords } from '../DnsRecords';
import type { AddressBookRow } from '../AddressBookRow';
import { asAddressFriendly } from '../../../utils/address';

export interface DNSRecordsResponseV3 {
    address_book: { [key: string]: AddressBookRowV3 };
    records: DNSRecordV3[];
}

export function toDnsRecords(data: DNSRecordsResponseV3): DnsRecords {
    const out: DnsRecords = {
        addressBook: {},
        records: data.records ? data.records.map(toDnsRecord) : [],
    };
    for (const key of Object.keys(data.address_book)) {
        out.addressBook[asAddressFriendly(key)] = {
            domain: data.address_book[key].domain,
        } as AddressBookRow;
    }
    return out;
}
