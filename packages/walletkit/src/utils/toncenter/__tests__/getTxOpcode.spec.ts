/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, expect, it } from 'vitest';

import { makeTx, JETTON_TRANSFER, JETTON_NOTIFY } from './testFixtures';
import { getTxOpcode } from '../getTxOpcode';

describe('getTxOpcode', () => {
    it('returns null when in_msg is null', () => {
        expect(getTxOpcode(makeTx(null))).toBeNull();
    });

    it('returns the opcode string from in_msg', () => {
        expect(getTxOpcode(makeTx(JETTON_TRANSFER))).toBe(JETTON_TRANSFER);
        expect(getTxOpcode(makeTx(JETTON_NOTIFY))).toBe(JETTON_NOTIFY);
    });

    it('returns null when in_msg.opcode is null', () => {
        const tx = makeTx(JETTON_TRANSFER);
        tx.in_msg!.opcode = null;
        expect(getTxOpcode(tx)).toBeNull();
    });
});
