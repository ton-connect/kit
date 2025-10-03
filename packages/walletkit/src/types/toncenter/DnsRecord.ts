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
