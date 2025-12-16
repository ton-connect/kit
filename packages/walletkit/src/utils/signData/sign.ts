/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Address } from '@ton/core';

import { createTextBinaryHash, createCellHash } from './hash';
import { Uint8ArrayToHex } from '../base64';
import type { PreparedSignData, UnpreparedSignData } from '../../api/models';

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
export async function PrepareSignData(data: UnpreparedSignData): Promise<PreparedSignData> {
    const { payload, domain, address } = data;
    const timestamp = Math.floor(Date.now() / 1000);
    const parsedAddr = Address.parse(address);

    // Create hash based on payload type
    const finalHash =
        payload.data?.type === 'cell'
            ? createCellHash(payload.data.value, parsedAddr, domain, timestamp)
            : await createTextBinaryHash(payload.data, parsedAddr, domain, timestamp);

    return {
        address,
        timestamp,
        domain,
        payload,
        hash: Uint8ArrayToHex(finalHash),
    };
}
