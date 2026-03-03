/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, expect, it } from 'vitest';

import { makeTx } from './testFixtures';
import { isTransactionFailed } from '../isTransactionFailed';

describe('isTransactionFailed', () => {
    it('returns false for a successful transaction', () => {
        expect(isTransactionFailed(makeTx())).toBe(false);
    });

    it('returns false when description is missing', () => {
        const tx = makeTx();
        // @ts-expect-error simulating unexpected data
        tx.description = undefined;
        expect(isTransactionFailed(tx)).toBe(false);
    });

    it('returns true when aborted is true', () => {
        expect(isTransactionFailed(makeTx(null, true))).toBe(true);
    });

    it('returns true when compute_ph.success is false', () => {
        const tx = makeTx();
        tx.description.compute_ph!.success = false;
        expect(isTransactionFailed(tx)).toBe(true);
    });

    it('returns true when action.success is false', () => {
        const tx = makeTx();
        tx.description.action!.success = false;
        expect(isTransactionFailed(tx)).toBe(true);
    });

    it('returns true when action.skipped_actions > 0', () => {
        const tx = makeTx();
        tx.description.action!.skipped_actions = 1;
        expect(isTransactionFailed(tx)).toBe(true);
    });
});
