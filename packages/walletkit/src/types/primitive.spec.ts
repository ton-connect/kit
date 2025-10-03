import { Cell } from '@ton/core';

import { fromTinyString, toStringTail, toTinyString } from './primitive';

describe('primitive', () => {
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
