import { TupleItem } from '@ton/core';
import { sha256_sync } from '@ton/crypto';
import { toHexString } from '@tonconnect/protocol';

import { ApiClient } from './ApiClient';
import { toStringTail } from '../primitive';

export const ROOT_DNS_RESOLVER = 'Ef_lZ1T4NCb2mwkme9h2rJfESCE0W34ma9lWp7-_uY3zXDvq'; // TODO getting from config#4

export enum DnsCategory {
    DnsNextResolver = 'dns_next_resolver',
    Wallet = 'wallet',
    Site = 'site',
    BagId = 'storage',
    All = 0,
}

export enum DnsRecord {
    SmcAddress = 0x9fd3,
    NextResolver = 0xba93,
    AdnlAddress = 0xad01,
    StorageAddress = 0x7473,
}

export function toDnsInternal(domain: string): string {
    domain = domain.toLowerCase().normalize('NFC');
    return domain.split('.').filter(Boolean).reverse().join('\0') + '\0';
}

export function toTonDnsCategory(category?: string | number): bigint {
    category = category ?? DnsCategory.All;
    if (typeof category === 'number') {
        return BigInt(category);
    }
    return BigInt('0x' + sha256_sync(category).toString('hex'));
}

export interface DnsLookupResult {
    resolved: string;
    unresolved: string;
    record?: string;
    value?: string;
}

export async function dnsResolve(
    client: ApiClient,
    domain: string,
    category?: DnsCategory,
    resolver?: string,
): Promise<DnsLookupResult | null> {
    let currentResolver = resolver ?? ROOT_DNS_RESOLVER;
    let unresolved = domain;

    while (true) {
        const step = await dnsLookup(client, unresolved, DnsCategory.DnsNextResolver, currentResolver);
        if (step == null) {
            return null;
        }

        if (step.unresolved) {
            if (!step.value) {
                return null;
            }
            currentResolver = step.value;
            unresolved = step.unresolved;
            continue;
        }

        if (step.record === 'NextResolver' && step.value) {
            if (category !== undefined) {
                return dnsLookup(client, '.', category, step.value);
            }
            currentResolver = step.value;
            unresolved = '.';
            continue;
        }

        if (category !== undefined) {
            return dnsLookup(client, '.', category, currentResolver);
        }

        return step;
    }
}

export async function dnsLookup(
    client: ApiClient,
    domain: string,
    category?: DnsCategory,
    resolver?: string,
): Promise<DnsLookupResult | null> {
    category = category ?? DnsCategory.DnsNextResolver;
    resolver = resolver ?? ROOT_DNS_RESOLVER;
    const result: DnsLookupResult = {
        resolved: '',
        unresolved: '',
    };
    const isSelf = domain === '.' || domain === '';
    const internal = toDnsInternal(domain);
    const param: TupleItem[] = [
        { type: 'slice', cell: toStringTail(internal) },
        { type: 'int', value: toTonDnsCategory(category) },
    ];
    const { stack, exitCode } = await client.runGetMethod(resolver, 'dnsresolve', param);

    if (exitCode !== 0) {
        return null;
    }
    const resolvedBit = stack.readNumber();
    if (resolvedBit === 0 || resolvedBit % 8 !== 0) {
        return null;
    }
    const resolvedByte = resolvedBit / 8;
    const part = isSelf ? [] : domain.split('.').filter(Boolean);
    const level = internal.slice(0, Number(resolvedByte)).split('.').filter(Boolean).length;
    result.unresolved = part.slice(0, part.length - level).join('.');
    result.resolved = part.slice(part.length - level).join('.');
    if (category === DnsCategory.All) {
        // TODO implement all categories are requested
        throw new Error('not implemented all categories are requested');
    }
    const cell = stack.readCellOpt();
    if (!cell) {
        return result;
    }
    const slice = cell.asSlice();
    const tag = slice.loadUint(16);
    if (tag == DnsRecord.NextResolver || tag == DnsRecord.SmcAddress) {
        result.value = slice.loadAddress().toString();
    } else if (tag == DnsRecord.AdnlAddress || tag == DnsRecord.StorageAddress) {
        result.value = toHexString(slice.loadBuffer(32));
    } else {
        result.value = cell.toBoc().toString('base64');
    }
    if (result.value) {
        result.record = DnsRecord[tag as DnsRecord];
    }
    return result;
}
