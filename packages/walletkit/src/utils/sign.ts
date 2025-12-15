/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { ISigner } from '../types/wallet';
import { Uint8ArrayToHex } from './base64';
import { Hex } from '../types/primitive';
import { loadTonCrypto } from '../deps/tonCrypto';

export async function DefaultSignature(data: Iterable<number>, privateKey: Uint8Array): Promise<Hex> {
    const { sign } = await loadTonCrypto();
    return Uint8ArrayToHex(sign(Buffer.from(Uint8Array.from(data)), Buffer.from(privateKey)));
}

export function createWalletSigner(privateKey: Uint8Array): ISigner {
    return async (data: Iterable<number>) => {
        return DefaultSignature(Uint8Array.from(data), privateKey);
    };
}

let fakeKeyPair: { publicKey: Buffer; secretKey: Buffer } | null = null;
async function getFakeKeyPair() {
    if (!fakeKeyPair) {
        const { keyPairFromSeed } = await loadTonCrypto();
        fakeKeyPair = keyPairFromSeed(Buffer.alloc(32, 0));
    }
    return fakeKeyPair;
}

export async function FakeSignature(data: Iterable<number>): Promise<Hex> {
    const { sign } = await loadTonCrypto();
    const keyPair = await getFakeKeyPair();
    return Uint8ArrayToHex([...sign(Buffer.from(Uint8Array.from(data)), Buffer.from(keyPair.secretKey))]);
}
