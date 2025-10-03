import { DNSRecordV3, toDnsRecord } from './DNSRecordV3';
import { AddressBookRowV3 } from './AddressBookRowV3';
import { DnsRecords } from '../DnsRecords';
import { AddressBookRow } from '../AddressBookRow';
import { asAddressFriendly } from '../../primitive';

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
