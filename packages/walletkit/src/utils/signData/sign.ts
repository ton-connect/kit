/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { SignDataPayload } from '@tonconnect/protocol';

import { createTextBinaryHash, createCellHash } from './hash';
import { Hex } from '../../types/primitive';
import { Uint8ArrayToHex } from '../base64';
import { EventSignDataResponse } from '../../types/events';
import { loadTonCore } from '../../deps/tonCore';

export interface SignDataParams {
    payload: SignDataPayload;
    domain: string;
    // privateKey: Buffer;
    address: string;
}

export interface PrepareSignDataResult {
    address: string;
    timestamp: number;
    domain: string;
    payload: SignDataPayload;
    hash: Hex;
}

export type SignDataResult = PrepareSignDataResult & EventSignDataResponse;

/**
 * Signs data according to TON Connect sign-data protocol.
 *
 * Supports three payload types:
 * 1. text - for text messages
 * 2. binary - for arbitrary binary data
 * 3. cell - for TON Cell with TL-B schema
 *
 * @param params Signing parameters
 * @returns Signed data with base64 signature
 */
export async function PrepareTonConnectData(params: SignDataParams): Promise<PrepareSignDataResult> {
    const { Address } = await loadTonCore();
    const { payload, domain, address } = params;
    const timestamp = Math.floor(Date.now() / 1000);
    const parsedAddr = Address.parse(address);

    // Create hash based on payload type
    const finalHash =
        payload.type === 'cell'
            ? await createCellHash(payload, parsedAddr, domain, timestamp)
            : await createTextBinaryHash(payload, parsedAddr, domain, timestamp);

    return {
        address,
        timestamp,
        domain,
        payload,
        hash: Uint8ArrayToHex(finalHash),
    };
}
