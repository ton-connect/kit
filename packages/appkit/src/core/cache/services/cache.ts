/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Emitter } from '../../events';
import type { CacheEntry, CacheKey, CacheResponse, CacheStatus } from '../types/common';
import type { Config, ParsedConfig } from '../types/config';
import type { CacheEventMap } from '../types/events';
import { CacheStatus as CacheStatusValues } from '../constants/common';
import { EmitterEvents } from '../constants/events';
import { createTimeCacheKey, getCacheKey } from '../utils/cache';
import { parseConfig } from '../utils/config';
import { isNullOrUndefined } from '../utils/guards';
import { sleep } from '../utils/misc';

export class Cache {
    public emitter: Emitter<CacheEventMap>;

    private config: ParsedConfig;
    private inFlightKeys = new Set<string>();

    constructor(config: Config) {
        this.config = parseConfig(config);
        this.emitter = new Emitter<CacheEventMap>();
    }

    private async removeEntry({
        cacheKey,
        storage,
    }: {
        cacheKey: CacheKey;
        storage: Config['storage'];
    }): Promise<void> {
        const key = getCacheKey(cacheKey);
        const timeKey = createTimeCacheKey(key);

        try {
            if (!storage.removeItem) {
                throw new Error('Storage does not support removeItem method');
            }

            await Promise.all([storage.removeItem(key), storage.removeItem(timeKey)]);
        } catch (error) {
            this.emitter.emit(EmitterEvents.CACHE_REMOVE_FAILED, { cacheKey: key, error }, 'swr-cache');
            throw error;
        }
    }

    private async write<CacheValue>({
        cacheKey,
        cacheValue,
        cacheTime,
        serialize,
        storage,
    }: {
        cacheKey: CacheKey;
        cacheValue: CacheValue;
        cacheTime: number;
        serialize: NonNullable<Config['serialize']>;
        storage: Config['storage'];
    }): Promise<void> {
        const key = getCacheKey(cacheKey);
        const timeKey = createTimeCacheKey(key);

        try {
            await Promise.all([
                storage.setItem(key, serialize(cacheValue)),
                storage.setItem(timeKey, cacheTime.toString()),
            ]);
            this.emitter.emit(EmitterEvents.CACHE_UPDATED, { cacheKey: key, cacheValue }, 'swr-cache');
        } catch (error) {
            this.emitter.emit(EmitterEvents.CACHE_SET_FAILED, { cacheKey: key, error }, 'swr-cache');
            throw error;
        }
    }

    private async read<CacheValue>({
        cacheKey,
        storage,
        deserialize,
    }: {
        cacheKey: CacheKey;
        storage: Config['storage'];
        deserialize: NonNullable<Config['deserialize']>;
    }): Promise<CacheEntry<CacheValue>> {
        const now = Date.now();
        const key = getCacheKey(cacheKey);
        const timeKey = createTimeCacheKey(key);

        try {
            const [cachedValue, cachedAt] = await Promise.all([storage.getItem(key), storage.getItem(timeKey)]);

            if (isNullOrUndefined(cachedValue) || isNullOrUndefined(cachedAt) || Number.isNaN(Number(cachedAt))) {
                return { cachedValue: null, cachedAge: 0, now };
            }

            const deserialized = deserialize(cachedValue);

            return {
                cachedValue: deserialized as CacheValue | null,
                cachedAge: now - Number(cachedAt),
                cachedAt: Number(cachedAt),
                now,
            };
        } catch (error) {
            this.emitter.emit(EmitterEvents.CACHE_GET_FAILED, { cacheKey: key, error }, 'swr-cache');
            throw error;
        }
    }

    public async get<CacheValue>(
        cacheKey: CacheKey,
        fn: () => CacheValue | Promise<CacheValue>,
        configOverrides?: Partial<Config>,
    ): Promise<CacheResponse<Awaited<CacheValue>>> {
        const { storage, minTimeToStale, maxTimeToLive, serialize, deserialize, retry, retryDelay } = configOverrides
            ? parseConfig({ ...this.config, ...configOverrides })
            : this.config;

        const key = getCacheKey(cacheKey);
        this.emitter.emit(EmitterEvents.INVOKE, { cacheKey: key, fn }, 'swr-cache');

        const timeKey = createTimeCacheKey(key);

        let invocationCount = 0;
        let cacheStatus: CacheStatus = CacheStatusValues.MISS;

        if (this.inFlightKeys.has(key)) {
            this.emitter.emit(EmitterEvents.CACHE_IN_FLIGHT, { key, cacheKey: key }, 'swr-cache');

            let inFlightListener: ((event: { payload: { key: string } }) => void) | null = null;

            await new Promise<void>((resolve) => {
                inFlightListener = (event: { payload: { key: string } }) => {
                    if (event.payload.key === key) {
                        resolve();
                    }
                };

                this.emitter.on(EmitterEvents.CACHE_IN_FLIGHT_SETTLED, inFlightListener);
            });

            if (inFlightListener) {
                this.emitter.off(EmitterEvents.CACHE_IN_FLIGHT_SETTLED, inFlightListener);
            }
        }

        this.inFlightKeys.add(key);

        const retrieveCachedValue = async (): Promise<CacheEntry<unknown>> => {
            const now = Date.now();

            try {
                let [cachedValue, cachedAt] = await Promise.all([storage.getItem(key), storage.getItem(timeKey)]);

                if (isNullOrUndefined(cachedValue) || isNullOrUndefined(cachedAt)) {
                    return { cachedValue: null, cachedAge: 0, now };
                }

                cachedValue = deserialize(cachedValue);

                const cachedAge = now - Number(cachedAt);

                if (cachedAge > maxTimeToLive) {
                    cacheStatus = CacheStatusValues.EXPIRED;
                    this.emitter.emit(
                        EmitterEvents.CACHE_EXPIRED,
                        {
                            cacheKey: key,
                            cachedAge,
                            cachedAt: Number(cachedAt),
                            cachedValue,
                            maxTimeToLive,
                        },
                        'swr-cache',
                    );
                    cachedValue = null;
                }

                return { cachedValue, cachedAge, cachedAt: Number(cachedAt), now };
            } catch (error) {
                this.emitter.emit(EmitterEvents.CACHE_GET_FAILED, { cacheKey: key, error }, 'swr-cache');
                return { cachedValue: null, cachedAge: 0, now };
            }
        };

        const revalidate = async ({ cacheTime }: { cacheTime: number }): Promise<Awaited<CacheValue>> => {
            try {
                if (invocationCount === 0) {
                    this.emitter.emit(EmitterEvents.REVALIDATE, { cacheKey: key, fn }, 'swr-cache');
                    this.inFlightKeys.add(key);
                }

                invocationCount++;

                let result: Awaited<CacheValue>;

                try {
                    result = await fn();
                } catch (error) {
                    if (!retry(invocationCount, error)) {
                        throw error;
                    }

                    const delay = retryDelay(invocationCount);

                    await sleep(delay);

                    return revalidate({ cacheTime });
                }

                // Error handled in `write` by emitting an event, so only need a no-op here
                await this.write({
                    cacheValue: result,
                    cacheKey,
                    cacheTime,
                    serialize,
                    storage,
                }).catch(() => {});

                return result;
            } catch (error) {
                this.emitter.emit(EmitterEvents.REVALIDATE_FAILED, { cacheKey: key, fn, error }, 'swr-cache');
                throw error;
            } finally {
                this.inFlightKeys.delete(key);
                this.emitter.emit(EmitterEvents.CACHE_IN_FLIGHT_SETTLED, { cacheKey: key, key }, 'swr-cache');
            }
        };

        const { cachedValue, cachedAge, cachedAt, now } = await retrieveCachedValue();

        if (!isNullOrUndefined(cachedValue) && !isNullOrUndefined(cachedAt)) {
            cacheStatus = CacheStatusValues.FRESH;
            this.emitter.emit(EmitterEvents.CACHE_HIT, { cacheKey: key, cachedValue }, 'swr-cache');

            if (cachedAge >= minTimeToStale) {
                cacheStatus = CacheStatusValues.STALE;
                this.emitter.emit(
                    EmitterEvents.CACHE_STALE,
                    {
                        cacheKey: key,
                        cachedValue,
                        cachedAge,
                    },
                    'swr-cache',
                );
                // Non-blocking so that revalidation runs while stale cache data is returned
                // Error handled in `revalidate` by emitting an event, so only need a no-op here
                revalidate({ cacheTime: Date.now() }).catch(() => {});
            } else {
                // When it is a pure cache hit, we are not revalidating, so we can remove the key from the in-flight set
                this.inFlightKeys.delete(key);
                this.emitter.emit(EmitterEvents.CACHE_IN_FLIGHT_SETTLED, { cacheKey: key, key }, 'swr-cache');
            }

            return {
                cachedAt,
                expireAt: cachedAt + maxTimeToLive,
                maxTimeToLive,
                minTimeToStale,
                now,
                staleAt: cachedAt + minTimeToStale,
                status: cacheStatus,
                value: cachedValue as Awaited<CacheValue>,
            };
        }

        this.emitter.emit(EmitterEvents.CACHE_MISS, { cacheKey: key, fn }, 'swr-cache');

        const revalidateCacheTime = Date.now();
        const result = await revalidate({ cacheTime: revalidateCacheTime });

        return {
            cachedAt: revalidateCacheTime,
            expireAt: revalidateCacheTime + maxTimeToLive,
            maxTimeToLive,
            minTimeToStale,
            now: revalidateCacheTime,
            staleAt: revalidateCacheTime + minTimeToStale,
            status: cacheStatus,
            value: result,
        };
    }

    public remove(cacheKey: CacheKey) {
        return this.removeEntry({
            cacheKey,
            storage: this.config.storage,
        });
    }

    public set<CacheValue>(cacheKey: CacheKey, cacheValue: CacheValue) {
        return this.write({
            cacheKey,
            cacheValue,
            cacheTime: Date.now(),
            serialize: this.config.serialize,
            storage: this.config.storage,
        });
    }

    public peek<CacheValue>(cacheKey: CacheKey) {
        return this.read<CacheValue>({
            cacheKey,
            storage: this.config.storage,
            deserialize: this.config.deserialize,
        });
    }
}
