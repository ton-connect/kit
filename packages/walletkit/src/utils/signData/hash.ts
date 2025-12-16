/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Address } from '@ton/core';
import { beginCell, Cell } from '@ton/core';

import { buf as crc32Buf } from './crc32';
import type { SignData, SignDataCell } from '../../api/models';
import { loadTonCrypto } from '../../deps';

/**
 * Creates hash for text or binary payload.
 * Message format:
 * message = 0xffff || "ton-connect/sign-data/" || workchain || address_hash || domain_len || domain || timestamp || payload
 */
export async function createTextBinaryHash(
    data: SignData,
    parsedAddr: Address,
    domain: string,
    timestamp: number,
): Promise<Buffer> {
    const { sha256_sync } = await loadTonCrypto();

    // Create workchain buffer
    const wcBuffer = Buffer.alloc(4);
    wcBuffer.writeInt32BE(parsedAddr.workChain);

    // Create domain buffer
    const domainBuffer = Buffer.from(domain, 'utf8');
    const domainLenBuffer = Buffer.alloc(4);
    domainLenBuffer.writeUInt32BE(domainBuffer.length);

    // Create timestamp buffer
    const tsBuffer = Buffer.alloc(8);
    tsBuffer.writeBigUInt64BE(BigInt(timestamp));

    // Create payload buffer
    const typePrefix = data.type === 'text' ? 'txt' : 'bin';
    const content = data.value.content;
    const encoding = data.type === 'text' ? 'utf8' : 'base64';

    const payloadPrefix = Buffer.from(typePrefix);
    const payloadBuffer = Buffer.from(content, encoding);
    const payloadLenBuffer = Buffer.alloc(4);
    payloadLenBuffer.writeUInt32BE(payloadBuffer.length);

    // Build message
    const message = Buffer.concat([
        Buffer.from([0xff, 0xff]),
        Buffer.from('ton-connect/sign-data/'),
        wcBuffer,
        parsedAddr.hash,
        domainLenBuffer,
        domainBuffer,
        tsBuffer,
        payloadPrefix,
        payloadLenBuffer,
        payloadBuffer,
    ]);

    // Hash message with sha256
    return sha256_sync(message); // crypto.createHash('sha256').update(message).digest()
}

/**
 * Creates hash for Cell payload according to TON Connect specification.
 */
export function createCellHash(payload: SignDataCell, parsedAddr: Address, domain: string, timestamp: number): Buffer {
    const cell = Cell.fromBase64(payload.content);
    const schemaHash = crc32Buf(Buffer.from(payload.schema, 'utf8'), undefined) >>> 0; // unsigned crc32 hash

    const tep81Domain = domain.split('.').reverse().join('\0') + '\0';

    const message = beginCell()
        .storeUint(0x75569022, 32) // prefix
        .storeUint(schemaHash, 32) // schema hash
        .storeUint(timestamp, 64) // timestamp
        .storeAddress(parsedAddr) // user wallet address
        .storeStringRefTail(tep81Domain) // app domain
        .storeRef(cell) // payload cell
        .endCell();

    return Buffer.from(message.hash());
}
