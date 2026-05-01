/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, expect, it } from 'vitest';

import { DEFAULT_GAS_BUFFER_NANOS, DEFAULT_SAFETY_MARGIN_NANOS, getTonShortfall } from './get-ton-shortfall';

const TON = { address: 'ton' };
const JETTON = { address: 'EQA_jetton_address' };

// Helper — convert a decimal string of TON to nanos as a string (for message amounts).
const toNanos = (ton: string): string => BigInt(Math.round(Number(ton) * 1e9)).toString();

describe('getTonShortfall', () => {
    it('returns undefined when TON balance covers the built transaction', () => {
        // Swap 1 TON, total tx outflow 1.3 TON (1 TON swap + 0.3 TON attached gas), balance 2 TON.
        const result = getTonShortfall({
            messages: [{ amount: toNanos('1.3') }],
            tonBalance: '2',
            fromToken: TON,
            fromAmount: '1',
        });
        expect(result).toBeUndefined();
    });

    it('returns topup when fromToken is a jetton and TON balance is below outflow + buffer', () => {
        // Jetton swap, tx needs 0.05 TON for gas, user has 0 TON.
        const result = getTonShortfall({
            messages: [{ amount: toNanos('0.05') }],
            tonBalance: '0',
            fromToken: JETTON,
            fromAmount: '100',
        });
        expect(result).toEqual({
            mode: 'topup',
            requiredNanos: 50_000_000n + DEFAULT_GAS_BUFFER_NANOS,
            suggestedFromAmount: '',
        });
    });

    it('returns reduce for TON-from when balance covers gas but not full amount', () => {
        // User wants 1 TON swap, total outflow 1.3 TON, has 1 TON. Gas only = 0.3 TON.
        // Balance (1) > nonSwapReserved (0.3 gas + 0.1 buffer + 0.02 safety = 0.42) → reduce mode.
        const result = getTonShortfall({
            messages: [{ amount: toNanos('1.3') }],
            tonBalance: '1',
            fromToken: TON,
            fromAmount: '1',
        });
        expect(result?.mode).toBe('reduce');
        if (result?.mode !== 'reduce') return;
        // Suggested = 1 - 0.42 = 0.58
        expect(result.suggestedFromAmount).toBe('0.58');
        expect(result.requiredNanos).toBe(1_300_000_000n + DEFAULT_GAS_BUFFER_NANOS);
    });

    it('returns topup for TON-from when balance cannot cover even gas (reducing would not help)', () => {
        // User wants 1 TON swap, total outflow 1.3 TON → gas = 0.3 TON. Balance 0.2 TON.
        // nonSwapReserved = 0.3 + 0.1 buffer + 0.02 safety = 0.42 TON → balance (0.2) <= 0.42 → topup.
        const result = getTonShortfall({
            messages: [{ amount: toNanos('1.3') }],
            tonBalance: '0.2',
            fromToken: TON,
            fromAmount: '1',
        });
        expect(result).toEqual({
            mode: 'topup',
            requiredNanos: 1_300_000_000n + DEFAULT_GAS_BUFFER_NANOS,
            suggestedFromAmount: '',
        });
    });

    it('treats an undefined tonBalance as zero', () => {
        const result = getTonShortfall({
            messages: [{ amount: toNanos('0.05') }],
            tonBalance: undefined,
            fromToken: JETTON,
            fromAmount: '100',
        });
        expect(result?.mode).toBe('topup');
    });

    it('sums amounts across multiple messages', () => {
        // Two messages attaching 0.6 TON each → totalOut = 1.2 TON. Balance 1 TON → shortfall.
        const result = getTonShortfall({
            messages: [{ amount: toNanos('0.6') }, { amount: toNanos('0.6') }],
            tonBalance: '1',
            fromToken: JETTON,
            fromAmount: '100',
        });
        expect(result?.mode).toBe('topup');
        expect(result?.requiredNanos).toBe(1_200_000_000n + DEFAULT_GAS_BUFFER_NANOS);
    });

    it('respects a custom gasBufferNanos', () => {
        const baseParams = {
            messages: [{ amount: toNanos('1.3') }],
            tonBalance: '1.3',
            fromToken: TON,
            fromAmount: '1',
        };

        // With the default buffer (0.1 TON), balance 1.3 is insufficient (needs 1.4).
        expect(getTonShortfall(baseParams)?.mode).toBe('reduce');

        // With a zero buffer, 1.3 TON balance covers the 1.3 TON outflow exactly.
        expect(getTonShortfall({ ...baseParams, gasBufferNanos: 0n })).toBeUndefined();
    });

    it('respects a custom safetyMarginNanos in the reduce branch', () => {
        // Default margin: suggested = balance - gas - buffer - 0.02 = 1 - 0.3 - 0.1 - 0.02 = 0.58
        // Zero margin:    suggested = balance - gas - buffer       = 1 - 0.3 - 0.1       = 0.6
        const baseParams = {
            messages: [{ amount: toNanos('1.3') }],
            tonBalance: '1',
            fromToken: TON,
            fromAmount: '1',
        };

        const withDefault = getTonShortfall(baseParams);
        expect(withDefault?.mode === 'reduce' ? withDefault.suggestedFromAmount : null).toBe('0.58');

        const withZero = getTonShortfall({ ...baseParams, safetyMarginNanos: 0n });
        expect(withZero?.mode === 'reduce' ? withZero.suggestedFromAmount : null).toBe('0.6');
    });

    it('flips from reduce to topup when a large custom safetyMarginNanos eats the balance', () => {
        // Balance 1 TON, gas 0.3 TON, buffer 0.1 TON. With a 1 TON safety margin, nonSwapReserved becomes 1.4 TON → topup.
        const result = getTonShortfall({
            messages: [{ amount: toNanos('1.3') }],
            tonBalance: '1',
            fromToken: TON,
            fromAmount: '1',
            safetyMarginNanos: 1_000_000_000n,
        });
        expect(result?.mode).toBe('topup');
    });

    it('exports sane default constants', () => {
        expect(DEFAULT_GAS_BUFFER_NANOS).toBe(100_000_000n);
        expect(DEFAULT_SAFETY_MARGIN_NANOS).toBe(20_000_000n);
    });
});
