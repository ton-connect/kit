/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, it, expect } from 'vitest';
import { CHAIN } from '@tonconnect/protocol';

import { validateTonAddress, detectAddressFormat, detectAddressNetwork } from './address';

describe('address validation', () => {
    const validRaw = '0:1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    const validBounceable = 'EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N';
    const validNonBounceable = 'UQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqEBI';

    describe('validateTonAddress', () => {
        it('should validate correct raw address', () => {
            const result = validateTonAddress(validRaw);
            expect(result.isValid).toBe(true);
        });

        it('should validate correct bounceable address', () => {
            const result = validateTonAddress(validBounceable);
            expect(result.isValid).toBe(true);
        });

        it('should validate correct non-bounceable address', () => {
            const result = validateTonAddress(validNonBounceable);
            expect(result.isValid).toBe(true);
        });

        it('should fail for invalid address', () => {
            const result = validateTonAddress('invalid-address');
            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });

        it('should return errors for invalid type', () => {
            // @ts-expect-error Testing invalid type input
            const result = validateTonAddress(123);
            expect(result.isValid).toBe(false);
        });
    });

    describe('detectAddressFormat', () => {
        it('should detect raw', () => {
            expect(detectAddressFormat(validRaw)).toBe('raw');
        });
        it('should detect bounceable', () => {
            expect(detectAddressFormat(validBounceable)).toBe('bounceable');
        });
        it('should detect non-bounceable', () => {
            expect(detectAddressFormat(validNonBounceable)).toBe('non-bounceable');
        });
        it('should detect unknown', () => {
            expect(detectAddressFormat('invalid')).toBe('unknown');
        });
    });

    describe('detectAddressNetwork', () => {
        it('should return unknown for raw', () => {
            expect(detectAddressNetwork(validRaw)).toBe('unknown');
        });

        it('should detect mainnet', () => {
            expect(detectAddressNetwork(validBounceable)).toBe(CHAIN.MAINNET);
        });

        // Add testnet address example if available/needed, but mainnet is enough coverage for logic
    });
});
