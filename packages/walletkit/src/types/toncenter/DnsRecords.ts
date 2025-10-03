import { AddressBookRow } from './AddressBookRow';
import { DnsRecord } from './DnsRecord';

export interface DnsRecords {
    addressBook: { [key: string]: AddressBookRow };
    records: DnsRecord[];
}
