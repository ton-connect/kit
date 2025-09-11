import { keyPairFromSeed, sign } from '@ton/crypto';

import { WalletSigner } from '../types/wallet';

export function DefaultSignature(data: Uint8Array, privateKey: Uint8Array): Uint8Array {
    return new Uint8Array(sign(Buffer.from(data), Buffer.from(privateKey)));
}

export function createWalletSigner(privateKey: Uint8Array): WalletSigner {
    return async (data: Uint8Array) => {
        return DefaultSignature(data, privateKey);
    };
}

const fakeKeyPair = keyPairFromSeed(Buffer.alloc(32, 0));
export function FakeSignature(data: Uint8Array): Uint8Array {
    return new Uint8Array(sign(Buffer.from(data), fakeKeyPair.secretKey));
}
