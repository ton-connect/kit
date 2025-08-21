import { keyPairFromSeed, sign } from '@ton/crypto';

export function DefaultSignature(data: Uint8Array, privateKey: Uint8Array): Uint8Array {
    return new Uint8Array(sign(Buffer.from(data), Buffer.from(privateKey)));
}

const fakeKeyPair = keyPairFromSeed(Buffer.alloc(32, 0));
export function FakeSignature(data: Uint8Array): Uint8Array {
    return new Uint8Array(sign(Buffer.from(data), fakeKeyPair.secretKey));
}
