/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ISigner } from '../api/interfaces';
import { Uint8ArrayToHex } from './base64';
import type { Hex } from '../api/models';
import { loadTonCrypto } from '../deps';

export async function DefaultSignature(data: Iterable<number>, privateKey: Uint8Array): Promise<Hex> {
    const { keyPairFromSeed, sign } = await loadTonCrypto();
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

let fakeKeyPairCache: { publicKey: Buffer; secretKey: Buffer } | null = null;

export async function FakeSignature(data: Iterable<number>): Promise<Hex> {
    const { keyPairFromSeed, sign } = await loadTonCrypto();
    if (!fakeKeyPairCache) {
        fakeKeyPairCache = keyPairFromSeed(Buffer.alloc(32, 0));
    }
    return Uint8ArrayToHex([...sign(Buffer.from(Uint8Array.from(data)), Buffer.from(fakeKeyPairCache.secretKey))]);
}
