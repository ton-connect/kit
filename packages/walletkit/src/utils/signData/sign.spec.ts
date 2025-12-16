/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { PrepareSignData } from './sign';

describe('PrepareSignData', () => {
    const testAddress = 'EQBvW8Z5huBkMJYdnfAEM5JqTNkuWX3diqYENkWsIL0XggGG';
    const testDomain = 'example.com';

    it('should prepare text sign data', async () => {
        const result = await PrepareSignData({
            address: testAddress,
            domain: testDomain,
            payload: { data: { type: 'text', value: { content: 'Hello' } } },
        });

        expect(result.address).toBe(testAddress);
        expect(result.domain).toBe(testDomain);
        expect(result.hash).toMatch(/^0x[a-f0-9]+$/);
        expect(result.timestamp).toBeGreaterThan(0);
    });

    it('should prepare binary sign data', async () => {
        const result = await PrepareSignData({
            address: testAddress,
            domain: testDomain,
            payload: { data: { type: 'binary', value: { content: 'SGVsbG8=' } } },
        });

        expect(result.hash).toMatch(/^0x[a-f0-9]+$/);
    });
});
