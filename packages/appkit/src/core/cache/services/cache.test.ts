/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';

import { Cache } from './cache';
import { createTimeCacheKey } from '../utils/cache';
import { mockedLocalStorage, valueFromEnvelope } from './__tests__/mock-storage';
import { EmitterEvents } from '../constants/events';

const validConfig = {
    storage: mockedLocalStorage,
};

describe('Cache', () => {
    beforeEach(() => {
        mockedLocalStorage.clear();
    });

    afterAll(() => {
        mockedLocalStorage.clear();
    });

    describe('Config', () => {
        it(`should throw an error if the config is missing`, () => {
            // @ts-expect-error calling function without config
            expect(() => new Cache()).toThrow();
        });

        it(`should create a Cache instance`, () => {
            const cache = new Cache(validConfig);
            expect(cache).toBeInstanceOf(Cache);
        });

        it('should allow overriding the cache config per invocation', async () => {
            const cache = new Cache(validConfig);
            const configOverrides = {
                minTimeToStale: 1000,
                maxTimeToLive: 2000,
            };
            const key = 'expired-config-override-example';
            const value1 = 'value 1';
            const value2 = 'value 2';
            const fn1 = vi.fn(() => value1);
            const fn2 = vi.fn(() => value2);
            const now = Date.now();
            const originalDateNow = Date.now;

            Date.now = vi.fn(() => now - 3000); // 3 seconds back in time
            const envelope1 = await cache.get(key, fn1, configOverrides);

            Date.now = originalDateNow; // Reset Date.now to original value so that cache for this key is expired
            const envelope2 = await cache.get(key, fn2, configOverrides);

            expect(valueFromEnvelope(envelope1)).toEqual(value1);
            expect(valueFromEnvelope(envelope2)).toEqual(value2);
            expect(fn1).toHaveBeenCalledTimes(1);
            expect(fn2).toHaveBeenCalledTimes(1);
        });
    });

    describe('Cache revalidation logic', () => {
        it('should invoke given function and persist to storage if not already freshly cached', async () => {
            const cache = new Cache(validConfig);
            const key = 'key';
            const value = 'value';
            const fn = vi.fn(async () => value);
            const result = await cache.get<string>(key, async () => await fn());

            expect(result).toMatchObject({
                value,
                status: 'miss',
                minTimeToStale: 0,
                maxTimeToLive: Infinity,
                now: expect.any(Number),
                cachedAt: expect.any(Number),
                expireAt: Infinity,
                staleAt: expect.any(Number),
            });
            expect(fn).toHaveBeenCalledTimes(1);
            expect(mockedLocalStorage.getItem(key)).toEqual(value);
            expect(mockedLocalStorage.getItem(createTimeCacheKey(key))).toEqual(expect.any(String));
        });

        it('should invoke custom serializer and deserializer methods when reading from cache', async () => {
            const customSerialize = vi.fn(JSON.stringify);
            const customDeserialize = vi.fn((val: unknown) => JSON.parse(val as string));
            const cache = new Cache({
                ...validConfig,
                serialize: customSerialize,
                deserialize: customDeserialize,
            });
            const key = 'key';
            const value = { value: 'value' };
            const fn = vi.fn(() => value);
            const result = await cache.get(key, fn);

            expect(result).toMatchObject({
                value: JSON.parse(JSON.stringify(value)),
                status: 'miss',
                minTimeToStale: 0,
                maxTimeToLive: Infinity,
                now: expect.any(Number),
                cachedAt: expect.any(Number),
                expireAt: Infinity,
                staleAt: expect.any(Number),
            });
            expect(fn).toHaveBeenCalledTimes(1);
            expect(customSerialize).toHaveBeenCalledTimes(1);
            expect(customDeserialize).toHaveBeenCalledTimes(0);
            expect(mockedLocalStorage.getItem(key)).toEqual(JSON.stringify(value));

            const result2 = await cache.get(key, fn);

            expect(result2).toMatchObject({
                value: JSON.parse(JSON.stringify(value)),
                status: 'stale',
                minTimeToStale: 0,
                maxTimeToLive: Infinity,
                now: expect.any(Number),
                cachedAt: expect.any(Number),
                expireAt: Infinity,
                staleAt: expect.any(Number),
            });
            expect(fn).toHaveBeenCalledTimes(2);
            expect(customSerialize).toHaveBeenCalledTimes(2);
            expect(customDeserialize).toHaveBeenCalledTimes(1);
            expect(mockedLocalStorage.getItem(key)).toEqual(JSON.stringify(value));
        });

        it('should not invoke custom deserializer method when cache value of undefined returned', async () => {
            const customSerialize = vi.fn(JSON.stringify);
            const customDeserialize = vi.fn((val: unknown) => JSON.parse(val as string));
            const cache = new Cache({
                ...validConfig,
                storage: {
                    ...validConfig.storage,
                    getItem() {
                        return undefined;
                    },
                },
                serialize: customSerialize,
                deserialize: customDeserialize,
            });
            const key = 'key';
            const value = { value: 'value' };
            const fn = vi.fn(() => value);
            const result = await cache.get(key, fn);

            expect(result).toMatchObject({
                value: JSON.parse(JSON.stringify(value)),
                status: 'miss',
                minTimeToStale: 0,
                maxTimeToLive: Infinity,
                now: expect.any(Number),
                cachedAt: expect.any(Number),
                expireAt: Infinity,
                staleAt: expect.any(Number),
            });
            expect(fn).toHaveBeenCalledTimes(1);
            expect(customSerialize).toHaveBeenCalledTimes(1);
            expect(customDeserialize).toHaveBeenCalledTimes(0);
            expect(mockedLocalStorage.getItem(key)).toEqual(JSON.stringify(value));
        });

        it('should not revalidate if the value is cached and still fresh', async () => {
            // Set minTimeToStale to 1 second so that the cache is fresh for second invocation
            const cache = new Cache({
                ...validConfig,
                minTimeToStale: 1000,
            });
            const key = 'fresh-example';
            const value1 = 'value 1';
            const value2 = 'value 2';
            const fn1 = vi.fn(() => value1);
            const fn2 = vi.fn(() => value2);
            const result1 = await cache.get(key, fn1);
            const result2 = await cache.get(key, fn2);

            expect(result1).toMatchObject({
                value: value1,
                status: 'miss',
                minTimeToStale: 1000,
                maxTimeToLive: Infinity,
                now: expect.any(Number),
                cachedAt: expect.any(Number),
                expireAt: Infinity,
                staleAt: expect.any(Number),
            });
            expect(result2).toMatchObject({
                value: value1,
                status: 'fresh',
                minTimeToStale: 1000,
                maxTimeToLive: Infinity,
                now: expect.any(Number),
                cachedAt: expect.any(Number),
                expireAt: Infinity,
                staleAt: expect.any(Number),
            });
            expect(fn1).toHaveBeenCalledTimes(1);
            expect(fn2).not.toHaveBeenCalled();
        });

        it('should return value from cache while revalidating the value in the background if cache is stale but not dead', async () => {
            // Explicitly set minTimeToStale to 0 and maxTimeToLive to Infinity so that the cache is always stale, but not dead for second invocation
            const cache = new Cache({
                ...validConfig,
                minTimeToStale: 0,
                maxTimeToLive: Infinity,
            });
            const key = 'stale-example';
            const value1 = 'value 1';
            const value2 = 'value 2';
            const fn1 = vi.fn(() => value1);
            const fn2 = vi.fn(() => value2);
            const result1 = await cache.get(key, fn1);
            const result2 = await cache.get(key, fn2);

            expect(result1).toMatchObject({
                value: value1,
                status: 'miss',
                minTimeToStale: 0,
                maxTimeToLive: Infinity,
                now: expect.any(Number),
                cachedAt: expect.any(Number),
                expireAt: Infinity,
                staleAt: expect.any(Number),
            });
            expect(result2).toMatchObject({
                value: value1, // Still return value1 since it is from the cache
                status: 'stale',
                minTimeToStale: 0,
                maxTimeToLive: Infinity,
                now: expect.any(Number),
                cachedAt: expect.any(Number),
                expireAt: Infinity,
                staleAt: expect.any(Number),
            });
            expect(fn1).toHaveBeenCalledTimes(1);
            expect(fn2).toHaveBeenCalledTimes(1); // But invoke the function to revalidate the value in the background
        });

        it('should not return a value from cache if it has expired', async () => {
            const cache = new Cache({
                ...validConfig,
                minTimeToStale: 1000,
                maxTimeToLive: 2000,
            });
            const key = 'expired-example';
            const value1 = 'value 1';
            const value2 = 'value 2';
            const fn1 = vi.fn(() => value1);
            const fn2 = vi.fn(() => value2);
            const now = Date.now();
            const originalDateNow = Date.now;

            Date.now = vi.fn(() => now - 3000); // 3 seconds back in time
            const result1 = await cache.get(key, fn1);

            Date.now = originalDateNow; // Reset Date.now to original value so that cache for this key is expired
            const result2 = await cache.get(key, fn2);

            expect(result1).toMatchObject({
                value: value1,
                status: 'miss',
                minTimeToStale: 1000,
                maxTimeToLive: 2000,
                now: expect.any(Number),
                cachedAt: expect.any(Number),
                expireAt: expect.any(Number),
                staleAt: expect.any(Number),
            });
            expect(result2).toMatchObject({
                value: value2,
                status: 'expired',
                minTimeToStale: 1000,
                maxTimeToLive: 2000,
                now: expect.any(Number),
                cachedAt: expect.any(Number),
                expireAt: expect.any(Number),
                staleAt: expect.any(Number),
            });
            expect(fn1).toHaveBeenCalledTimes(1);
            expect(fn2).toHaveBeenCalledTimes(1);
        });

        it('should deduplicate any concurrent requests with the same key', async () => {
            // Explicitly set minTimeToStale to 1_000 and maxTimeToLive to Infinity so that the cache is not stale, but also not dead for second invocation
            const cache = new Cache({
                ...validConfig,
                minTimeToStale: 1_000,
                maxTimeToLive: Infinity,
            });
            const key = 'duplicate-example';
            const value1 = 'value 1';
            const value2 = 'value 2';
            const fn1 = vi.fn(() => value1);
            const fn2 = vi.fn(() => value2);

            const promise1 = cache.get(key, fn1);
            const promise2 = cache.get(key, fn2);
            const [result1, result2] = await Promise.all([promise1, promise2]);

            expect(result1).toMatchObject({
                value: value1,
                status: 'miss',
                minTimeToStale: 1_000,
                maxTimeToLive: Infinity,
                now: expect.any(Number),
                cachedAt: expect.any(Number),
                expireAt: Infinity,
                staleAt: expect.any(Number),
            });
            expect(result2).toMatchObject({
                value: value1, // Still return value1 since it is from the cache
                status: 'fresh',
                minTimeToStale: 1_000,
                maxTimeToLive: Infinity,
                now: expect.any(Number),
                cachedAt: expect.any(Number),
                expireAt: Infinity,
                staleAt: expect.any(Number),
            });
            expect(fn1).toHaveBeenCalledTimes(1);
            expect(fn2).not.toHaveBeenCalled();
        });

        describe('Retry', () => {
            it('should allow retrying the request using a number of retries', async () => {
                const cache = new Cache({
                    ...validConfig,
                    minTimeToStale: 0,
                    maxTimeToLive: Infinity,
                    retry: 3,
                    retryDelay: 0,
                });
                const key = 'retry-example';
                const error = new Error('beep boop');
                const fn = vi.fn(() => {
                    throw error;
                });

                expect.assertions(2);

                try {
                    await cache.get(key, fn);

                    throw new Error('Expected cache.get to throw an error');
                } catch (err) {
                    expect(err).toBe(error);
                } finally {
                    expect(fn).toHaveBeenCalledTimes(4); // Initial invocation + 3 retries
                }
            });
        });

        it('should allow retrying the request using a custom retry function', async () => {
            const cache = new Cache({
                ...validConfig,
                minTimeToStale: 0,
                maxTimeToLive: Infinity,
                retry: (failureCount, _error) => failureCount < 3,
                retryDelay: () => 10,
            });
            const key = 'retry-example';
            const error = new Error('beep boop');
            const fn = vi.fn(() => {
                throw error;
            });

            expect.assertions(2);

            try {
                await cache.get(key, fn);

                throw new Error('Expected cache.get to throw an error');
            } catch (err) {
                expect(err).toBe(error);
            } finally {
                expect(fn).toHaveBeenCalledTimes(3); // Initial invocation + 2 retries (testing failureCount < 3)
            }
        });
    });

    describe('EmitterEvents', () => {
        it(`should emit an '${EmitterEvents.REVALIDATE_FAILED}' event if the cache is stale but not dead and the revalidation request fails`, async () => {
            // Explicitly set minTimeToStale to 0 and maxTimeToLive to Infinity so that the cache is always stale, but not dead for second invocation
            const cache = new Cache({
                ...validConfig,
                minTimeToStale: 0,
                maxTimeToLive: Infinity,
            });
            const key = 'stale-example';
            const value1 = 'value 1';
            const error = new Error('beep boop');
            const fn1 = vi.fn(() => value1);
            const fn2 = vi.fn(() => {
                throw error;
            });

            const result1 = await cache.get(key, fn1);

            expect(result1).toMatchObject({
                value: value1,
                status: 'miss',
                minTimeToStale: 0,
                maxTimeToLive: Infinity,
                now: expect.any(Number),
                cachedAt: expect.any(Number),
                expireAt: Infinity,
                staleAt: expect.any(Number),
            });

            const eventPromise = new Promise((resolve) => {
                cache.emitter.once(EmitterEvents.REVALIDATE_FAILED, (event) => {
                    resolve(event.payload);
                });
            });
            const result2Promise = cache.get(key, fn2);

            const payload = await eventPromise;
            expect(payload).toEqual({
                cacheKey: key,
                fn: fn2,
                error,
            });

            const result2 = await result2Promise;

            expect(result2).toMatchObject({
                value: value1, // Still return value1 since it is from the cache
                status: 'stale',
                minTimeToStale: 0,
                maxTimeToLive: Infinity,
                now: expect.any(Number),
                cachedAt: expect.any(Number),
                expireAt: Infinity,
                staleAt: expect.any(Number),
            });
            expect(fn1).toHaveBeenCalledTimes(1);
            expect(fn2).toHaveBeenCalledTimes(1); // But invoke the function to revalidate the value in the background
        });

        it(`should emit an '${EmitterEvents.INVOKE}' event when called`, async () => {
            const cache = new Cache(validConfig);
            const key = 'key';
            const value = 'value';
            const fn = vi.fn(() => value);

            const eventPromise = new Promise((resolve) => {
                cache.emitter.once(EmitterEvents.INVOKE, (event) => {
                    resolve(event.payload);
                });
            });
            cache.get(key, fn);
            const payload = await eventPromise;

            expect(payload).toEqual({
                cacheKey: key,
                fn,
            });
        });

        it(`should emit a '${EmitterEvents.CACHE_HIT}' event when the value is found in the cache`, async () => {
            const cache = new Cache({
                ...validConfig,
                minTimeToStale: 10000,
            });
            const key = 'key';
            const value = 'value';
            const fn = vi.fn(() => value);

            // Manually set the value in the cache
            await cache.set(key, value);

            const eventPromise = new Promise((resolve) => {
                cache.emitter.once(EmitterEvents.CACHE_HIT, (event) => {
                    resolve(event.payload);
                });
            });
            cache.get(key, fn);
            const payload = await eventPromise;

            expect(payload).toEqual({
                cacheKey: key,
                cachedValue: value,
            });
        });

        it(`should emit a '${EmitterEvents.CACHE_MISS}' event when the value is not found in the cache`, async () => {
            const cache = new Cache(validConfig);
            const key = 'key';
            const value = 'value';
            const fn = vi.fn(() => value);

            const eventPromise = new Promise((resolve) => {
                cache.emitter.once(EmitterEvents.CACHE_MISS, (event) => {
                    resolve(event.payload);
                });
            });
            cache.get(key, fn);
            const payload = await eventPromise;

            expect(payload).toEqual({
                cacheKey: key,
                fn,
            });
        });

        it(`should emit '${EmitterEvents.CACHE_HIT}', '${EmitterEvents.CACHE_STALE}' and '${EmitterEvents.REVALIDATE}' emitter when the cache is stale but not expired`, async () => {
            const cache = new Cache({
                ...validConfig,
                minTimeToStale: 0,
                maxTimeToLive: Infinity,
            });
            const key = 'key';
            const oldValue = 'old value';
            const value = 'value';
            const fn = vi.fn(() => value);

            const now = Date.now();
            const originalDateNow = Date.now;
            Date.now = vi.fn(() => now);

            // Manually set the value in the cache
            await Promise.all([
                validConfig.storage.setItem(key, oldValue),
                validConfig.storage.setItem(createTimeCacheKey(key), (now - 10000).toString()),
            ]);

            const emitter: Record<string | symbol, unknown> = {};

            cache.emitter.on('CACHE_HIT', (event) => {
                emitter['CACHE_HIT'] = event.payload;
            });
            cache.emitter.on('CACHE_STALE', (event) => {
                emitter['CACHE_STALE'] = event.payload;
            });
            cache.emitter.on('INVOKE', (event) => {
                emitter['INVOKE'] = event.payload;
            });
            cache.emitter.on('REVALIDATE', (event) => {
                emitter['REVALIDATE'] = event.payload;
            });

            await cache.get(key, fn);

            Date.now = originalDateNow;

            expect(emitter).toMatchObject({
                CACHE_HIT: {
                    cacheKey: 'key',
                    cachedValue: 'old value',
                },
                CACHE_STALE: {
                    cacheKey: 'key',
                    cachedAge: 10000,
                    cachedValue: 'old value',
                },
                INVOKE: {
                    cacheKey: 'key',
                    // fn: fn, - Mock functions are hard to duplicate exactly in structure,
                },
                REVALIDATE: {
                    cacheKey: 'key',
                    // fn: fn,
                },
            });
        });

        it(`should emit '${EmitterEvents.CACHE_GET_FAILED}' event when an error is thrown when retrieving from the storage and continue as-if cache is expired`, async () => {
            const error = new Error('storage read error');
            const cache = new Cache({
                ...validConfig,
                storage: {
                    ...validConfig.storage,
                    getItem() {
                        throw error;
                    },
                },
                minTimeToStale: 0,
                maxTimeToLive: Infinity,
            });
            const key = 'storage-get-error';
            const value = 'value';
            const fn = vi.fn(() => value);

            expect.assertions(2);

            const eventPromise = new Promise((resolve) => {
                cache.emitter.once(EmitterEvents.CACHE_GET_FAILED, (event) => {
                    resolve(event.payload);
                });
            });
            const resultPromise = cache.get(key, fn);

            const payload = await eventPromise;
            expect(payload).toEqual({
                cacheKey: key,
                error,
            });

            const result = await resultPromise;
            expect(result).toMatchObject({
                value,
                status: 'miss',
            });
        });

        it(`should emit '${EmitterEvents.CACHE_SET_FAILED}' event when an error is thrown when retrieving from the storage`, async () => {
            const error = new Error('storage persist error');
            const cache = new Cache({
                ...validConfig,
                storage: {
                    ...validConfig.storage,
                    setItem() {
                        throw error;
                    },
                },
                minTimeToStale: 0,
                maxTimeToLive: Infinity,
            });
            const key = 'storage-set-error';
            const value = 'value';
            const fn = vi.fn(() => value);

            expect.assertions(2);

            const eventPromise = new Promise((resolve) => {
                cache.emitter.once(EmitterEvents.CACHE_SET_FAILED, (event) => {
                    resolve(event.payload);
                });
            });
            const resultPromise = cache.get(key, fn);

            const payload = await eventPromise;
            expect(payload).toEqual({
                cacheKey: key,
                error,
            });

            const result = await resultPromise;
            expect(result).toMatchObject({
                value,
                status: 'miss',
            });
        });
    });

    describe('cache.set()', () => {
        it('should persist given cache value for given key including the time cache key', async () => {
            const cache = new Cache(validConfig);

            const key = 'persist key';
            const value = 'value';

            expect(mockedLocalStorage.getItem(key)).toEqual(null);
            expect(mockedLocalStorage.getItem(createTimeCacheKey(key))).toEqual(null);

            await cache.set(key, value);

            expect(mockedLocalStorage.getItem(key)).toEqual(value);
            expect(mockedLocalStorage.getItem(createTimeCacheKey(key))).toEqual(expect.any(String));

            const fn = vi.fn(() => 'something else');
            const result = await cache.get(key, fn);

            expect(result).toMatchObject({
                value,
                status: 'stale',
                minTimeToStale: 0,
                maxTimeToLive: Infinity,
                now: expect.any(Number),
                cachedAt: expect.any(Number),
                expireAt: Infinity,
                staleAt: expect.any(Number),
            });
            expect(fn).toHaveBeenCalledTimes(1);
        });
    });

    describe('cache.remove()', () => {
        it('should remove the cache value for given key including the time cache key', async () => {
            const cache = new Cache(validConfig);

            const key = 'delete key';
            const value = 'value';

            expect(mockedLocalStorage.getItem(key)).toEqual(null);
            expect(mockedLocalStorage.getItem(createTimeCacheKey(key))).toEqual(null);

            await cache.set(key, value);

            expect(mockedLocalStorage.getItem(key)).toEqual(value);
            expect(mockedLocalStorage.getItem(createTimeCacheKey(key))).toEqual(expect.any(String));

            await cache.remove(key);

            expect(mockedLocalStorage.getItem(key)).toEqual(null);
            expect(mockedLocalStorage.getItem(createTimeCacheKey(key))).toEqual(null);
        });
    });

    describe('cache.peek()', () => {
        it('should return the cache value and metadata for given key', async () => {
            const cache = new Cache(validConfig);

            const key = 'retrieve key';
            const value = 'value';

            const now = Date.now();

            // Manually set the value in the cache
            await Promise.all([
                validConfig.storage.setItem(key, value),
                validConfig.storage.setItem(
                    createTimeCacheKey(key),
                    (now + 10000).toString(), // 10 seconds in the future
                ),
            ]);

            const result = await cache.peek(key);

            expect(result).toMatchObject({
                cachedValue: value,
                cachedAge: expect.any(Number),
                cachedAt: expect.any(Number),
                now: expect.any(Number),
            });
        });

        it('should return null for cachedValue if the cache value is not found', async () => {
            const cache = new Cache(validConfig);

            const key = 'retrieve missing key';

            const result = await cache.peek(key);

            expect(result).toMatchObject({
                cachedValue: null,
                cachedAge: 0,
                now: expect.any(Number),
            });
        });

        describe('Array Keys', () => {
            it('should support array keys', async () => {
                const cache = new Cache(validConfig);
                const key = ['user', 123, 'profile']; // Array key
                const value = 'user profile';
                const fn = vi.fn(() => value);

                const result = await cache.get(key, fn);

                expect(result).toMatchObject({
                    value,
                    status: 'miss',
                });
                expect(fn).toHaveBeenCalledTimes(1);
                expect(mockedLocalStorage.getItem('user-123-profile')).toEqual(value);
            });
        });
    });
});
