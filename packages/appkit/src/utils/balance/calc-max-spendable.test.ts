/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, expect, it } from 'vitest';

import { calcMaxSpendable, DEFAULT_TON_FEE_RESERVE_NANOS } from './calc-max-spendable';

const TON = { address: 'ton', decimals: 9 };
const JETTON = { address: 'EQA_jetton', decimals: 6 };

describe('calcMaxSpendable', () => {
    it('returns balance minus the TON fee reserve for native TON', () => {
        // 1 TON balance, default reserve 0.1 TON → 0.9 TON spendable.
        expect(calcMaxSpendable({ balance: '1', token: TON })).toBe('0.9');
    });

    it('returns the full balance for a jetton (no reserve)', () => {
        expect(calcMaxSpendable({ balance: '100', token: JETTON })).toBe('100');
    });

    it('clamps to zero when balance is below the reserve', () => {
        expect(calcMaxSpendable({ balance: '0.05', token: TON })).toBe('0');
    });

    it('clamps to zero when balance equals the reserve', () => {
        expect(calcMaxSpendable({ balance: '0.1', token: TON })).toBe('0');
    });

    it('respects a custom feeReserveNanos', () => {
        // 1 TON balance, 0.5 TON reserve → 0.5 TON spendable.
        expect(calcMaxSpendable({ balance: '1', token: TON, feeReserveNanos: 500_000_000n })).toBe('0.5');
    });

    it('ignores feeReserveNanos for jettons', () => {
        expect(calcMaxSpendable({ balance: '100', token: JETTON, feeReserveNanos: 999_999_999_999n })).toBe('100');
    });

    it('exports a sane default reserve', () => {
        expect(DEFAULT_TON_FEE_RESERVE_NANOS).toBe(100_000_000n);
    });
});
