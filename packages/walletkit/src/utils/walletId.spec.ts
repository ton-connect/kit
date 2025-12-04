/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { CHAIN } from '@tonconnect/protocol';

import { createWalletId, parseWalletId, getAddressFromWalletId, getNetworkFromWalletId, isWalletId } from './walletId';

describe('walletId', () => {
    const testAddress = 'EQDtFpEwcFAEcRe5mLVh2N6C0x-_hJEM7W61_JLnSF74p4q2';

    describe('createWalletId', () => {
        it('should create wallet ID for mainnet', () => {
            const walletId = createWalletId(CHAIN.MAINNET, testAddress);

            expect(walletId).toBe(`${CHAIN.MAINNET}:${testAddress}`);
        });

        it('should create wallet ID for testnet', () => {
            const walletId = createWalletId(CHAIN.TESTNET, testAddress);

            expect(walletId).toBe(`${CHAIN.TESTNET}:${testAddress}`);
        });
    });

    describe('parseWalletId', () => {
        it('should parse valid mainnet wallet ID', () => {
            const walletId = `${CHAIN.MAINNET}:${testAddress}`;
            const result = parseWalletId(walletId);

            expect(result).toEqual({
                network: CHAIN.MAINNET,
                address: testAddress,
            });
        });

        it('should parse valid testnet wallet ID', () => {
            const walletId = `${CHAIN.TESTNET}:${testAddress}`;
            const result = parseWalletId(walletId);

            expect(result).toEqual({
                network: CHAIN.TESTNET,
                address: testAddress,
            });
        });

        it('should return undefined for wallet ID without colon', () => {
            const result = parseWalletId(testAddress);

            expect(result).toBeUndefined();
        });

        it('should return undefined for invalid network', () => {
            const result = parseWalletId(`invalid:${testAddress}`);

            expect(result).toBeUndefined();
        });

        it('should return undefined for empty address', () => {
            const result = parseWalletId(`${CHAIN.MAINNET}:`);

            expect(result).toBeUndefined();
        });

        it('should handle address containing colons', () => {
            const addressWithColon = 'EQDtFpEwcFAEcRe5mLVh2N6C0x:special';
            const walletId = `${CHAIN.MAINNET}:${addressWithColon}`;
            const result = parseWalletId(walletId);

            expect(result).toEqual({
                network: CHAIN.MAINNET,
                address: addressWithColon,
            });
        });
    });

    describe('getAddressFromWalletId', () => {
        it('should extract address from valid mainnet wallet ID', () => {
            const walletId = `${CHAIN.MAINNET}:${testAddress}`;
            const address = getAddressFromWalletId(walletId);

            expect(address).toBe(testAddress);
        });

        it('should extract address from valid testnet wallet ID', () => {
            const walletId = `${CHAIN.TESTNET}:${testAddress}`;
            const address = getAddressFromWalletId(walletId);

            expect(address).toBe(testAddress);
        });

        it('should return original string for invalid wallet ID (backwards compatibility)', () => {
            const address = getAddressFromWalletId(testAddress);

            expect(address).toBe(testAddress);
        });
    });

    describe('getNetworkFromWalletId', () => {
        it('should extract mainnet from wallet ID', () => {
            const walletId = `${CHAIN.MAINNET}:${testAddress}`;
            const network = getNetworkFromWalletId(walletId);

            expect(network).toBe(CHAIN.MAINNET);
        });

        it('should extract testnet from wallet ID', () => {
            const walletId = `${CHAIN.TESTNET}:${testAddress}`;
            const network = getNetworkFromWalletId(walletId);

            expect(network).toBe(CHAIN.TESTNET);
        });

        it('should return undefined for invalid wallet ID', () => {
            const network = getNetworkFromWalletId(testAddress);

            expect(network).toBeUndefined();
        });
    });

    describe('isWalletId', () => {
        it('should return true for valid mainnet wallet ID', () => {
            const walletId = `${CHAIN.MAINNET}:${testAddress}`;

            expect(isWalletId(walletId)).toBe(true);
        });

        it('should return true for valid testnet wallet ID', () => {
            const walletId = `${CHAIN.TESTNET}:${testAddress}`;

            expect(isWalletId(walletId)).toBe(true);
        });

        it('should return false for plain address', () => {
            expect(isWalletId(testAddress)).toBe(false);
        });

        it('should return false for invalid network prefix', () => {
            expect(isWalletId(`0:${testAddress}`)).toBe(false);
        });

        it('should return false for empty string', () => {
            expect(isWalletId('')).toBe(false);
        });
    });

    describe('integration', () => {
        it('should round-trip wallet ID creation and parsing', () => {
            const network = CHAIN.MAINNET;
            const address = testAddress;

            const walletId = createWalletId(network, address);
            const parsed = parseWalletId(walletId);

            expect(parsed).toEqual({ network, address });
        });

        it('should handle both networks correctly', () => {
            const networks = [CHAIN.MAINNET, CHAIN.TESTNET];

            for (const network of networks) {
                const walletId = createWalletId(network, testAddress);

                expect(isWalletId(walletId)).toBe(true);
                expect(getNetworkFromWalletId(walletId)).toBe(network);
                expect(getAddressFromWalletId(walletId)).toBe(testAddress);
            }
        });
    });
});
