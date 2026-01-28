/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, it, expect, vi } from 'vitest';

import { parseConfig } from './config';
import { passThrough } from './misc';
import { mockedLocalStorage } from '../__tests__/mock-storage';

describe('parseConfig', () => {
    it('should throw an error if the given value is not a plain object', () => {
        const invalidConfigs = [null, undefined, 0, '', Symbol(), [], async function () {}, new Function()];

        invalidConfigs.forEach((invalidConfig) => {
            // @ts-expect-error explicitly calling function with invalid config
            expect(() => parseConfig(invalidConfig)).toThrowError();
        });
    });

    it('should throw an error if a valid storage object is not provided', () => {
        const invalidConfigs = [
            {},
            { storage: null },
            { storage: undefined },
            { storage: 0 },
            { storage: '' },
            { storage: Symbol() },
            { storage: [] },
            { storage: async function () {} },

            { storage: new Function() },
            { storage: { getItem: null, setItem: null } },
        ];

        invalidConfigs.forEach((invalidConfig) => {
            // @ts-expect-error explicitly calling function with invalid config
            expect(() => parseConfig(invalidConfig)).toThrowError();
        });
    });

    it('should throw an error if the minTimeToStale is greater or equal to maxTimeToLive', () => {
        const invalidConfigs = [
            { storage: mockedLocalStorage, minTimeToStale: 10, maxTimeToLive: 5 },
            { storage: mockedLocalStorage, minTimeToStale: 10, maxTimeToLive: 10 },
        ];

        invalidConfigs.forEach((invalidConfig) => {
            expect(() => parseConfig(invalidConfig)).toThrowError();
        });
    });

    it('should set sensible defaults', () => {
        const config = parseConfig({ storage: mockedLocalStorage });
        expect(config.storage).toBe(mockedLocalStorage);
        expect(config.minTimeToStale).toBe(0);
        expect(config.maxTimeToLive).toBe(Infinity);
        expect(config.serialize).toBe(passThrough);
        expect(config.deserialize).toBe(passThrough);
    });

    it('should allow custom serialize and deserialize methods', () => {
        const customSerialize = vi.fn(() => 'serialized');
        const customDeserialize = vi.fn(() => 'deserialized');
        const config = parseConfig({
            storage: mockedLocalStorage,
            serialize: customSerialize,
            deserialize: customDeserialize,
        });
        expect(config.serialize).toBe(customSerialize);
        expect(config.deserialize).toBe(customDeserialize);
    });
});
