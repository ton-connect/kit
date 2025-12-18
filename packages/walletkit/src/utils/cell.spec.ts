/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Cell } from '@ton/core';

import { fromTinyString, toStringTail, toTinyString } from '../utils/cell';

describe('Cells parsing', () => {
    it('toStringTail', async () => {
        expect(toStringTail('').toString()).toEqual('x{}');
        expect(toStringTail('s'.repeat(2)).toString()).toEqual(`x{${'73'.repeat(2)}}`);
        expect(toStringTail('s'.repeat(555)).toString()).toEqual(`x{${'73'.repeat(127)}}`);
    });

    it('toTinyString', async () => {
        expect(toTinyString('ton').toString()).toEqual('x{03746F6E}');
    });

    it('fromTinyString', async () => {
        expect(fromTinyString(Cell.fromHex('b5ee9c7241010101000600000803746f6e39288b0f')).toString()).toEqual('ton');
    });
});
