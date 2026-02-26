/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { keyPairFromSeed, sign } from '@ton/crypto';
import { domainSign } from '@ton/core';

import type { ISigner } from '../api/interfaces';
import { Uint8ArrayToHex } from './base64';
import type { Hex, SignatureDomain } from '../api/models';

export function DefaultSignature(data: Iterable<number>, privateKey: Uint8Array): Hex {
    let fullKey = privateKey;
    if (fullKey.length === 32) {
        const keyPair = keyPairFromSeed(Buffer.from(fullKey));
        fullKey = keyPair.secretKey;
    }
    return Uint8ArrayToHex(sign(Buffer.from(Uint8Array.from(data)), Buffer.from(fullKey)));
}

export function DefaultDomainSignature(data: Iterable<number>, privateKey: Uint8Array, domain: SignatureDomain): Hex {
    let fullKey = privateKey;
    if (fullKey.length === 32) {
        const keyPair = keyPairFromSeed(Buffer.from(fullKey));
        fullKey = keyPair.secretKey;
    }
    return Uint8ArrayToHex(
        domainSign({
            data: Buffer.from(Uint8Array.from(data)),
            secretKey: Buffer.from(fullKey),
            domain: domain,
        }),
    );
}

export function createWalletSigner(privateKey: Uint8Array, domain?: SignatureDomain): ISigner {
    if (domain) {
        return async (data: Iterable<number>) => {
            return DefaultDomainSignature(Uint8Array.from(data), privateKey, domain);
        };
    }

    return async (data: Iterable<number>) => {
        return DefaultSignature(Uint8Array.from(data), privateKey);
    };
}

const fakeKeyPair = keyPairFromSeed(Buffer.alloc(32, 0));
export function FakeSignature(data: Iterable<number>): Hex {
    return Uint8ArrayToHex([...sign(Buffer.from(Uint8Array.from(data)), Buffer.from(fakeKeyPair.secretKey))]);
}
