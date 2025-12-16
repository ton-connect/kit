/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { DefaultSignature, createWalletSigner, FakeSignature } from './sign';

describe('sign utilities', () => {
    const testPrivateKey32 = Buffer.alloc(32, 1);
    const testData = [1, 2, 3, 4, 5];

    describe('DefaultSignature', () => {
        it('should sign data with 32-byte private key', async () => {
            const signature = await DefaultSignature(testData, testPrivateKey32);
            expect(signature).toBeDefined();
            expect(signature.startsWith('0x')).toBe(true);
            expect(signature.length).toBe(130); // 0x + 64 bytes hex = 130
        });

        it('should sign data with 64-byte private key', async () => {
            const fullKey = Buffer.alloc(64, 2);
            const signature = await DefaultSignature(testData, fullKey);
            expect(signature).toBeDefined();
            expect(signature.startsWith('0x')).toBe(true);
        });
    });

    describe('createWalletSigner', () => {
        it('should create a signer function', async () => {
            const signer = createWalletSigner(testPrivateKey32);
            expect(typeof signer).toBe('function');
        });

        it('should sign data using created signer', async () => {
            const signer = createWalletSigner(testPrivateKey32);
            const signature = await signer(testData);
            expect(signature).toBeDefined();
            expect(signature.startsWith('0x')).toBe(true);
        });
    });

    describe('FakeSignature', () => {
        it('should return a fake signature', async () => {
            const signature = await FakeSignature(testData);
            expect(signature).toBeDefined();
            expect(signature.startsWith('0x')).toBe(true);
            expect(signature.length).toBe(130);
        });

        it('should cache fake key pair', async () => {
            const signature1 = await FakeSignature(testData);
            const signature2 = await FakeSignature(testData);
            expect(signature1).toBe(signature2);
        });
    });
});
