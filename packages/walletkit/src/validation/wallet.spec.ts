/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, it, expect, vi } from 'vitest';

import { validatePublicKey, validateWalletVersion, validateWalletMethods, validateWallet } from './wallet';
import type { Wallet } from '../api/interfaces';

describe('wallet validation', () => {
    describe('validatePublicKey', () => {
        it('should validate correct public key', () => {
            const validKey = '0'.repeat(64);
            const result = validatePublicKey(validKey);
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should reject invalid public key', () => {
            const invalidLength = '0'.repeat(63);
            const r1 = validatePublicKey(invalidLength);
            expect(r1.isValid).toBe(false);
            expect(r1.errors).toContainEqual(expect.stringContaining('must be 64 characters long'));

            const invalidChars = 'x'.repeat(64);
            const r2 = validatePublicKey(invalidChars);
            expect(r2.isValid).toBe(false);
            expect(r2.errors).toContainEqual(expect.stringContaining('hexadecimal characters'));

            const empty = '';
            const r3 = validatePublicKey(empty);
            expect(r3.isValid).toBe(false);
        });
    });

    describe('validateWalletVersion', () => {
        it('should validate correct versions', () => {
            expect(validateWalletVersion('v3r1').isValid).toBe(true);
            expect(validateWalletVersion('v4r2').isValid).toBe(true);
            expect(validateWalletVersion('v5r1').isValid).toBe(true);
        });

        it('should reject invalid versions', () => {
            expect(validateWalletVersion('v1r1').isValid).toBe(false);
            expect(validateWalletVersion('invalid').isValid).toBe(false);
            expect(validateWalletVersion('').isValid).toBe(false);
        });
    });

    describe('validateWalletMethods', () => {
        it('should pass for valid wallet', async () => {
            const mockWallet = {
                getAddress: vi.fn().mockResolvedValue('valid-address'),
                getBalance: vi.fn().mockResolvedValue('100'),
                getStateInit: vi.fn().mockResolvedValue('state-init'),
            } as unknown as Wallet;

            const result = await validateWalletMethods(mockWallet);
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should fail if methods throw', async () => {
            const mockWallet = {
                getAddress: vi.fn().mockRejectedValue(new Error('fail')),
                getBalance: vi.fn().mockResolvedValue('100'),
            } as unknown as Wallet;

            const result = await validateWalletMethods(mockWallet);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContainEqual(expect.stringContaining('getAddress() failed'));
        });
    });

    describe('validateWallet', () => {
        it('should return valid result (placeholder)', () => {
            const result = validateWallet({} as Wallet);
            expect(result.isValid).toBe(true);
        });
    });
});
