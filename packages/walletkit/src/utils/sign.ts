/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { keyPairFromSeed, sign } from '@ton/crypto';
import type { SignatureDomain } from '@ton/core';
import { domainSign } from '@ton/core';

import type { ISigner } from '../api/interfaces';
import { Uint8ArrayToHex } from './base64';
import type { Hex } from '../api/models';

export function DefaultSignature(data: Iterable<number>, privateKey: Uint8Array): Hex {
    let fullKey = privateKey;
    if (fullKey.length === 32) {
        const keyPair = keyPairFromSeed(Buffer.from(fullKey));
        fullKey = keyPair.secretKey;
    }
    return Uint8ArrayToHex(sign(Buffer.from(Uint8Array.from(data)), Buffer.from(fullKey)));
}

export function createWalletSigner(privateKey: Uint8Array): ISigner {
    return async (data: Iterable<number>) => {
        return DefaultSignature(Uint8Array.from(data), privateKey);
    };
}

const fakeKeyPair = keyPairFromSeed(Buffer.alloc(32, 0));
export function FakeSignature(data: Iterable<number>): Hex {
    return Uint8ArrayToHex([...sign(Buffer.from(Uint8Array.from(data)), Buffer.from(fakeKeyPair.secretKey))]);
}

/**
 * Sign data with optional domain support
 * This is a helper function that uses domainSign if domain is provided, otherwise uses regular sign
 * Note: This requires access to secretKey, so it's only usable when secretKey is available
 */
export function signWithDomain(data: Buffer, secretKey: Buffer, domain?: SignatureDomain): Buffer {
    if (domain) {
        return domainSign({
            data,
            secretKey,
            domain,
        });
    }
    return sign(data, secretKey);
}
