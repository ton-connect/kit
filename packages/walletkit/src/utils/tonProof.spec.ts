/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Address } from '@ton/core';
import { ed25519 } from '@noble/curves/ed25519';

import { SignatureVerify, CreateTonProofMessageBytes, CreateTonProofMessage } from './tonProof';
import { Uint8ArrayToHex } from './base64';
import type { ProofMessage } from '../api/models';
import { asHex } from './hex';

describe('tonProof', () => {
    describe('SignatureVerify', () => {
        it('should verify valid ed25519 signature', () => {
            const privateKey = ed25519.utils.randomSecretKey();
            const publicKey = ed25519.getPublicKey(privateKey);
            const message = new TextEncoder().encode('test message');
            const signature = ed25519.sign(message, privateKey);

            expect(SignatureVerify(publicKey, message, signature)).toBe(true);
        });

        it('should reject invalid signature', () => {
            const privateKey = ed25519.utils.randomSecretKey();
            const publicKey = ed25519.getPublicKey(privateKey);
            const message = new TextEncoder().encode('test message');
            const wrongMessage = new TextEncoder().encode('wrong message');
            const signature = ed25519.sign(wrongMessage, privateKey);

            expect(SignatureVerify(publicKey, message, signature)).toBe(false);
        });

        it('should reject signature with wrong public key', () => {
            const privateKey1 = ed25519.utils.randomSecretKey();
            const privateKey2 = ed25519.utils.randomSecretKey();
            const publicKey2 = ed25519.getPublicKey(privateKey2);
            const message = new TextEncoder().encode('test message');
            const signature = ed25519.sign(message, privateKey1);

            expect(SignatureVerify(publicKey2, message, signature)).toBe(false);
        });
    });

    describe('CreateTonProofMessageBytes', () => {
        const testMessage: ProofMessage = {
            workchain: 0,
            addressHash: asHex('0x' + '00'.repeat(32)),
            timestamp: 1700000000,
            domain: {
                lengthBytes: 11,
                value: 'example.com',
            },
            payload: 'test-payload',
            stateInit: 'base64-state-init',
        };

        it('should create message bytes deterministically', async () => {
            const result1 = await CreateTonProofMessageBytes(testMessage);
            const result2 = await CreateTonProofMessageBytes(testMessage);

            expect(result1).toEqual(result2);
        });

        it('should return 32-byte hash', async () => {
            const result = await CreateTonProofMessageBytes(testMessage);

            expect(result).toBeInstanceOf(Uint8Array);
            expect(result.length).toBe(32);
        });

        it('should produce different hashes for different timestamps', async () => {
            const message1: ProofMessage = { ...testMessage, timestamp: 1700000000 };
            const message2: ProofMessage = { ...testMessage, timestamp: 1700000001 };

            const result1 = await CreateTonProofMessageBytes(message1);
            const result2 = await CreateTonProofMessageBytes(message2);

            expect(Buffer.from(result1).equals(Buffer.from(result2))).toBe(false);
        });

        it('should produce different hashes for different domains', async () => {
            const message1: ProofMessage = { ...testMessage, domain: { lengthBytes: 11, value: 'example.com' } };
            const message2: ProofMessage = { ...testMessage, domain: { lengthBytes: 9, value: 'other.com' } };

            const result1 = await CreateTonProofMessageBytes(message1);
            const result2 = await CreateTonProofMessageBytes(message2);

            expect(Buffer.from(result1).equals(Buffer.from(result2))).toBe(false);
        });

        it('should produce different hashes for different payloads', async () => {
            const message1: ProofMessage = { ...testMessage, payload: 'payload-1' };
            const message2: ProofMessage = { ...testMessage, payload: 'payload-2' };

            const result1 = await CreateTonProofMessageBytes(message1);
            const result2 = await CreateTonProofMessageBytes(message2);

            expect(Buffer.from(result1).equals(Buffer.from(result2))).toBe(false);
        });

        it('should produce different hashes for different addresses', async () => {
            const message1: ProofMessage = { ...testMessage, addressHash: asHex('0x' + '00'.repeat(32)) };
            const message2: ProofMessage = { ...testMessage, addressHash: asHex('0x' + 'ff'.repeat(32)) };

            const result1 = await CreateTonProofMessageBytes(message1);
            const result2 = await CreateTonProofMessageBytes(message2);

            expect(Buffer.from(result1).equals(Buffer.from(result2))).toBe(false);
        });
    });

    describe('createTonProofMessage', () => {
        const testAddress = Address.parse('EQBynBO23ywHy_CgarY9NK9FTz0yDsG82PtcbSTQgGoXwiuA');
        const testDomain = { lengthBytes: 11, value: 'example.com' };
        const testPayload = 'test-payload';
        const testStateInit = 'base64-state-init';
        const testTimestamp = 1700000000;

        it('should create ton proof message with correct fields', () => {
            const result = CreateTonProofMessage({
                address: testAddress,
                domain: testDomain,
                payload: testPayload,
                stateInit: testStateInit,
                timestamp: testTimestamp,
            });

            expect(result.workchain).toBe(testAddress.workChain);
            expect(result.addressHash).toBe(Uint8ArrayToHex(testAddress.hash));
            expect(result.domain.lengthBytes).toBe(testDomain.lengthBytes);
            expect(result.domain.value).toBe(testDomain.value);
            expect(result.payload).toBe(testPayload);
            expect(result.stateInit).toBe(testStateInit);
            expect(result.timestamp).toBe(testTimestamp);
        });

        it('should not include signature field', () => {
            const result = CreateTonProofMessage({
                address: testAddress,
                domain: testDomain,
                payload: testPayload,
                stateInit: testStateInit,
                timestamp: testTimestamp,
            });

            expect(result.signature).toBeUndefined();
        });

        it('should handle workchain 0 address', () => {
            const workchain0Address = Address.parse('EQBynBO23ywHy_CgarY9NK9FTz0yDsG82PtcbSTQgGoXwiuA');

            const result = CreateTonProofMessage({
                address: workchain0Address,
                domain: testDomain,
                payload: testPayload,
                stateInit: testStateInit,
                timestamp: testTimestamp,
            });

            expect(result.workchain).toBe(0);
        });

        it('should handle masterchain address', () => {
            const masterchainAddress = Address.parse('Ef8zMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzM0vF');

            const result = CreateTonProofMessage({
                address: masterchainAddress,
                domain: testDomain,
                payload: testPayload,
                stateInit: testStateInit,
                timestamp: testTimestamp,
            });

            expect(result.workchain).toBe(-1);
        });

        it('should produce message compatible with CreateTonProofMessageBytes', async () => {
            const message = CreateTonProofMessage({
                address: testAddress,
                domain: testDomain,
                payload: testPayload,
                stateInit: testStateInit,
                timestamp: testTimestamp,
            });

            const messageBytes = await CreateTonProofMessageBytes(message);

            expect(messageBytes).toBeInstanceOf(Uint8Array);
            expect(messageBytes.length).toBe(32);
        });
    });

    describe('integration', () => {
        it('should create verifiable proof flow', async () => {
            const privateKey = ed25519.utils.randomSecretKey();
            const publicKey = ed25519.getPublicKey(privateKey);

            const address = Address.parse('EQBynBO23ywHy_CgarY9NK9FTz0yDsG82PtcbSTQgGoXwiuA');
            const domain = { lengthBytes: 11, value: 'example.com' };
            const payload = 'nonce-123456';
            const stateInit = 'base64-state-init';
            const timestamp = Math.floor(Date.now() / 1000);

            const message = CreateTonProofMessage({
                address,
                domain,
                payload,
                stateInit,
                timestamp,
            });

            const messageBytes = await CreateTonProofMessageBytes(message);
            const signature = ed25519.sign(messageBytes, privateKey);

            expect(SignatureVerify(publicKey, messageBytes, signature)).toBe(true);
        });

        it('should reject tampered proof', async () => {
            const privateKey = ed25519.utils.randomSecretKey();
            const publicKey = ed25519.getPublicKey(privateKey);

            const address = Address.parse('EQBynBO23ywHy_CgarY9NK9FTz0yDsG82PtcbSTQgGoXwiuA');
            const domain = { lengthBytes: 11, value: 'example.com' };
            const stateInit = 'base64-state-init';
            const timestamp = Math.floor(Date.now() / 1000);

            const originalMessage = CreateTonProofMessage({
                address,
                domain,
                payload: 'original-payload',
                stateInit,
                timestamp,
            });

            const originalBytes = await CreateTonProofMessageBytes(originalMessage);
            const signature = ed25519.sign(originalBytes, privateKey);

            const tamperedMessage = CreateTonProofMessage({
                address,
                domain,
                payload: 'tampered-payload',
                stateInit,
                timestamp,
            });

            const tamperedBytes = await CreateTonProofMessageBytes(tamperedMessage);

            expect(SignatureVerify(publicKey, tamperedBytes, signature)).toBe(false);
        });
    });
});
