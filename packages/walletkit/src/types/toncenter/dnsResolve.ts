/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { TupleItem } from '@ton/core';
import { toHexString } from '@tonconnect/protocol';

import { ApiClient } from './ApiClient';
import { toStringTail } from '../primitive';
import { ParseStack, SerializeStack } from '../../utils/tvmStack';
import { loadTonCrypto } from '../../deps/tonCrypto';

export const ROOT_DNS_RESOLVER_MAINNET = 'Ef_lZ1T4NCb2mwkme9h2rJfESCE0W34ma9lWp7-_uY3zXDvq'; // TODO getting from config#4
export const ROOT_DNS_RESOLVER_TESTNET = 'kf_v5x0Thgr6pq6ur2NvkWhIf4DxAxsL-Nk5rknT6n99oEkd'; // TODO getting from config#4

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

export async function toTonDnsCategory(category?: string | number): Promise<bigint> {
    category = category ?? DnsCategory.All;
    if (typeof category === 'number') {
        return BigInt(category);
    }
    const { sha256_sync } = await loadTonCrypto();
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
    let currentResolver = resolver ?? ROOT_DNS_RESOLVER_MAINNET;
    let unresolved = domain;

    let maxResolveDepth = 100;

    while (maxResolveDepth > 0) {
        maxResolveDepth--;
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

    return null;
}

export async function dnsLookup(
    client: ApiClient,
    domain: string,
    category?: DnsCategory,
    resolver?: string,
): Promise<DnsLookupResult | null> {
    category = category ?? DnsCategory.DnsNextResolver;
    resolver = resolver ?? ROOT_DNS_RESOLVER_MAINNET;
    const result: DnsLookupResult = {
        resolved: '',
        unresolved: '',
    };
    const isSelf = domain === '.' || domain === '';
    const internal = toDnsInternal(domain);
    const param: TupleItem[] = [
        { type: 'slice', cell: await toStringTail(internal) },
        { type: 'int', value: await toTonDnsCategory(category) },
    ];
    const { stack, exitCode } = await client.runGetMethod(resolver, 'dnsresolve', await SerializeStack(param));
    if (stack?.length !== 2) {
        return null;
    }
    const parsedStack = await ParseStack(stack);

    if (exitCode !== 0) {
        return null;
    }
    const resolvedBit = parsedStack[0].type === 'int' ? Number(parsedStack[0].value) : 0; // stack.length > 0 ? (stack[0].type === 'num' ? Numberstack[0].value : 0) : 0; // stack.readNumber();
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
    const cell = parsedStack[1].type === 'cell' ? parsedStack[1].cell : null;
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
