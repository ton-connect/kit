import { keyPairFromSeed, sign } from '@ton/crypto';

import { ISigner } from '../types/wallet';
import { Uint8ArrayToHash } from './base64';
import { Hash } from '../types/primitive';

export function DefaultSignature(data: Iterable<number>, privateKey: Uint8Array): Hash {
    return Uint8ArrayToHash(sign(Buffer.from(Uint8Array.from(data)), Buffer.from(privateKey)));
}

export function createWalletSigner(privateKey: Uint8Array): ISigner {
    return async (data: Iterable<number>) => {
        return DefaultSignature(Uint8Array.from(data), privateKey);
    };
}

const fakeKeyPair = keyPairFromSeed(Buffer.alloc(32, 0));
export function FakeSignature(data: Iterable<number>): Hash {
    return Uint8ArrayToHash([...sign(Buffer.from(Uint8Array.from(data)), Buffer.from(fakeKeyPair.secretKey))]);
}
