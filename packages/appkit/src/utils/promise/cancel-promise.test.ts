/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, expect, it } from 'vitest';

import { cancelPromise } from './cancel-promise';

describe('cancelPromise', () => {
    it('should resolve if promise resolves before timeout', async () => {
        const promise = new Promise((resolve) => setTimeout(() => resolve('success'), 10));
        await expect(cancelPromise(promise, 50)).resolves.toBe('success');
    });

    it('should reject if promise times out', async () => {
        const promise = new Promise((resolve) => setTimeout(() => resolve('success'), 50));
        await expect(cancelPromise(promise, 10)).rejects.toThrow('Execution timed out - 10ms');
    });

    it('should propagate rejection from original promise', async () => {
        const promise = new Promise((_, reject) => setTimeout(() => reject(new Error('failure')), 10));
        await expect(cancelPromise(promise, 50)).rejects.toThrow('failure');
    });
});
