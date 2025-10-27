/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { keyPairFromSeed, sign } from '@ton/crypto';

import { ISigner } from '../types/wallet';
import { Uint8ArrayToHex } from './base64';
import { Hex } from '../types/primitive';

export function DefaultSignature(data: Iterable<number>, privateKey: Uint8Array): Hex {
    return Uint8ArrayToHex(sign(Buffer.from(Uint8Array.from(data)), Buffer.from(privateKey)));
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
