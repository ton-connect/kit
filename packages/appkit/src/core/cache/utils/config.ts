/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Config, RetryDelayFn, RetryFn } from '../types/config';
import { RetryDefaults } from '../constants/common';
import { isFunction, isPlainObject } from './guards';
import { passThrough } from './misc';

const defaultRetryDelay: RetryDelayFn = (invocationCount) =>
    Math.min(RetryDefaults.MIN_MS * 2 ** invocationCount, RetryDefaults.MAX_MS);

export function parseConfig(config: Config) {
    if (!isPlainObject(config)) {
        throw new Error('Config is required');
    }

    const storage = config.storage;

    if (!isPlainObject(storage) || !isFunction(storage.getItem) || !isFunction(storage.setItem)) {
        throw new Error('Storage is required and should satisfy the Config["storage"] type');
    }

    const minTimeToStale = config.minTimeToStale || 0;
    const maxTimeToLive =
        config.maxTimeToLive === Infinity
            ? Infinity
            : Math.min(config.maxTimeToLive ?? 0, Number.MAX_SAFE_INTEGER) || Infinity;

    const retry: RetryFn = (failureCount, error) => {
        if (!config.retry) return false;

        if (typeof config.retry === 'number') {
            return failureCount <= config.retry;
        }

        if (isFunction(config.retry)) {
            return !!config.retry(failureCount, error);
        }

        return !!config.retry;
    };
    const retryDelay: RetryDelayFn = (invocationCount) => {
        if (typeof config.retryDelay === 'number') {
            return config.retryDelay;
        }

        if (isFunction(config.retryDelay)) {
            return config.retryDelay(invocationCount);
        }

        return defaultRetryDelay(invocationCount);
    };

    const serialize = isFunction(config.serialize) ? config.serialize : passThrough;
    const deserialize = isFunction(config.deserialize) ? config.deserialize : passThrough;

    if (minTimeToStale >= maxTimeToLive) {
        throw new Error('minTimeToStale must be less than maxTimeToLive');
    }

    return {
        storage,
        minTimeToStale,
        maxTimeToLive,
        retry,
        retryDelay,
        serialize,
        deserialize,
    };
}
