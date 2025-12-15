/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Address } from '@ton/core';
import { CHAIN } from '@tonconnect/protocol';
import { ed25519 } from '@noble/curves/ed25519';
import type { Wallet } from '@tonconnect/sdk';
import type { TonProofItemReplySuccess } from '@tonconnect/protocol';

import {
    SignatureVerify,
    CreateTonProofMessageBytes,
    ConvertTonProofMessage,
    createTonProofMessage,
    TonProofParsedMessage,
} from './tonProof';
import { Uint8ArrayToHex } from './base64';
import { asHex } from '../types/primitive';

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
        const testMessage: TonProofParsedMessage = {
            workchain: 0,
            address: asHex('0x' + '00'.repeat(32)),
            timstamp: 1700000000,
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
            const message1 = { ...testMessage, timstamp: 1700000000 };
            const message2 = { ...testMessage, timstamp: 1700000001 };

            const result1 = await CreateTonProofMessageBytes(message1);
            const result2 = await CreateTonProofMessageBytes(message2);

            expect(Buffer.from(result1).equals(Buffer.from(result2))).toBe(false);
        });

        it('should produce different hashes for different domains', async () => {
            const message1 = { ...testMessage, domain: { lengthBytes: 11, value: 'example.com' } };
            const message2 = { ...testMessage, domain: { lengthBytes: 9, value: 'other.com' } };

            const result1 = await CreateTonProofMessageBytes(message1);
            const result2 = await CreateTonProofMessageBytes(message2);

            expect(Buffer.from(result1).equals(Buffer.from(result2))).toBe(false);
        });

        it('should produce different hashes for different payloads', async () => {
            const message1 = { ...testMessage, payload: 'payload-1' };
            const message2 = { ...testMessage, payload: 'payload-2' };

            const result1 = await CreateTonProofMessageBytes(message1);
            const result2 = await CreateTonProofMessageBytes(message2);

            expect(Buffer.from(result1).equals(Buffer.from(result2))).toBe(false);
        });

        it('should produce different hashes for different addresses', async () => {
            const message1 = { ...testMessage, address: asHex('0x' + '00'.repeat(32)) };
            const message2 = { ...testMessage, address: asHex('0x' + 'ff'.repeat(32)) };

            const result1 = await CreateTonProofMessageBytes(message1);
            const result2 = await CreateTonProofMessageBytes(message2);

            expect(Buffer.from(result1).equals(Buffer.from(result2))).toBe(false);
        });
    });

    describe('ConvertTonProofMessage', () => {
        const mockWallet: Wallet = {
            device: {
                platform: 'browser',
                appName: 'TestWallet',
                appVersion: '1.0.0',
                maxProtocolVersion: 2,
                features: [],
            },
            provider: 'http',
            account: {
                address: 'EQBynBO23ywHy_CgarY9NK9FTz0yDsG82PtcbSTQgGoXwiuA',
                chain: CHAIN.MAINNET,
                walletStateInit:
                    'te6cckECFgEAAwQAAgE0ARUBFP8A9KQT9LzyyAsCAgEgAxACAUgEBwLm0AHQ0wMhcbCSXwTgItdJwSCSXwTgAtMfIYIQcGx1Z70ighBibG5jvbAighBkc3RyvbCSXwXgA/pAMCD6RAHIygfL/8nQ7UTQgQFA1yH0BDBcgQEI9ApvoTGzkl8H4AXTP8glghBwbHVnupI4MOMNA4IQZHN0teleEgUBEgGggVsQbwHIgSDXSYEBC7ry4Igg1wsKIIEE/7ry0ImDCbry4IjPFgEGASH2zwHIygfL/8nQIPQEBXAggQCAPIEBCPQWyPQAye1UBAgLAgFIERICAUgVEAC5sv4gBD0hY+l/gOEEIsSe9DqgCDXIdBVMTyBQJugFMjLBxLMzMsHAs8WcM8WAcnQIIEBCPQOb6Ex8BrI9ADQUP4L+ChSQMcF8B3IUATPFslQBMzJcfsAVGVlYgIBWA0OALm18FAHIgCDXIdcLHwLwH8jwH4C8BnI8B+AvAZyPAfgLwGcjwH4C8BnI8B+AhA2X/4DcBSBqhBrYWFmZnEbZ2dxE2tnYRNlZKE5ciJujinQ0wfUAvsA1DDQMwHwGsjJ0CByIAg10mBAQu68uCIINcLCiCBBP+68tCJgwm68uCIzxYSyz/JcfsAABGwpAAVa5GwABVrgbAAdO1E0NIAAZfTP9M/0j/SAdACAVgTFAAB1AIBIBYVABGwr7tRNDSAAGAAdbJu40NWlwZnM6Ly9RbVJUZ3F0aGNTYklLQ2pNYk1iaWNMejdNAA=',
            },
            connectItems: {
                tonProof: {
                    name: 'ton_proof',
                    proof: {
                        timestamp: 1700000000,
                        domain: { lengthBytes: 11, value: 'example.com' },
                        signature: 'SGVsbG8gV29ybGQ=',
                        payload: 'test-payload',
                    },
                },
            },
        };

        const mockTonProof: TonProofItemReplySuccess = {
            name: 'ton_proof',
            proof: {
                timestamp: 1700000000,
                domain: { lengthBytes: 11, value: 'example.com' },
                signature: 'SGVsbG8gV29ybGQ=',
                payload: 'test-payload',
            },
        };

        it('should convert wallet info to parsed message', async () => {
            const result = await ConvertTonProofMessage(mockWallet, mockTonProof);

            expect(result.workchain).toBe(0);
            expect(result.domain.lengthBytes).toBe(11);
            expect(result.domain.value).toBe('example.com');
            expect(result.payload).toBe('test-payload');
            expect(result.timstamp).toBe(1700000000);
            expect(result.stateInit).toBe(mockWallet.account.walletStateInit);
        });

        it('should parse address correctly', async () => {
            const result = await ConvertTonProofMessage(mockWallet, mockTonProof);

            expect(result.address).toMatch(/^0x[0-9a-f]{64}$/);
        });

        it('should convert signature to hex', async () => {
            const result = await ConvertTonProofMessage(mockWallet, mockTonProof);

            expect(result.signature).toBeDefined();
            expect(result.signature).toMatch(/^0x[0-9a-f]+$/);
        });

        it('should handle masterchain address', async () => {
            const masterchainWallet: Wallet = {
                ...mockWallet,
                account: {
                    ...mockWallet.account,
                    address: 'Ef8zMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzM0vF',
                },
            };

            const result = await ConvertTonProofMessage(masterchainWallet, mockTonProof);

            expect(result.workchain).toBe(-1);
        });
    });

    describe('createTonProofMessage', () => {
        const testAddress = Address.parse('EQBynBO23ywHy_CgarY9NK9FTz0yDsG82PtcbSTQgGoXwiuA');
        const testDomain = { lengthBytes: 11, value: 'example.com' };
        const testPayload = 'test-payload';
        const testStateInit = 'base64-state-init';
        const testTimestamp = 1700000000;

        it('should create ton proof message with correct fields', () => {
            const result = createTonProofMessage({
                address: testAddress,
                domain: testDomain,
                payload: testPayload,
                stateInit: testStateInit,
                timestamp: testTimestamp,
            });

            expect(result.workchain).toBe(testAddress.workChain);
            expect(result.address).toBe(Uint8ArrayToHex(testAddress.hash));
            expect(result.domain.lengthBytes).toBe(testDomain.lengthBytes);
            expect(result.domain.value).toBe(testDomain.value);
            expect(result.payload).toBe(testPayload);
            expect(result.stateInit).toBe(testStateInit);
            expect(result.timstamp).toBe(testTimestamp);
        });

        it('should not include signature field', () => {
            const result = createTonProofMessage({
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

            const result = createTonProofMessage({
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

            const result = createTonProofMessage({
                address: masterchainAddress,
                domain: testDomain,
                payload: testPayload,
                stateInit: testStateInit,
                timestamp: testTimestamp,
            });

            expect(result.workchain).toBe(-1);
        });

        it('should produce message compatible with CreateTonProofMessageBytes', async () => {
            const message = createTonProofMessage({
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

            const message = createTonProofMessage({
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

            const originalMessage = createTonProofMessage({
                address,
                domain,
                payload: 'original-payload',
                stateInit,
                timestamp,
            });

            const originalBytes = await CreateTonProofMessageBytes(originalMessage);
            const signature = ed25519.sign(originalBytes, privateKey);

            const tamperedMessage = createTonProofMessage({
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
