/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AnalyticsEvent } from './swagger';

type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;

type KebabToCamel<T extends string> = T extends `${infer H}-${infer J}${infer K}`
    ? `${Uncapitalize<H>}${Capitalize<J>}${KebabToCamel<K>}`
    : T;

type KebabToPascal<T extends string> = Capitalize<KebabToCamel<T>>;

export type Analytics<TEvent extends AnalyticsEvent = AnalyticsEvent, TOptional extends keyof TEvent = 'event_name'> = {
    [E in TEvent as `emit${KebabToPascal<E['event_name']>}`]: (
        event: Omit<Optional<E, TOptional>, 'event_name'>,
    ) => void;
};

export interface AnalyticsAppInfo {
    env?: 'bridge' | 'miniapp' | 'wallet' | 'web';
    platform?: 'ios' | 'ipad' | 'android' | 'macos' | 'windows' | 'linux';
    browser?: string;
    appName?: string;
    appVersion?: string;

    /**
     * Retrieves the user's current locale setting.
     */
    getLocale?(): string;

    /**
     * Retrieves current user id.
     */
    getCurrentUserId?(): string;
}

export type AnalyticsManagerOptions = {
    appInfo?: AnalyticsAppInfo;
    endpoint?: string;
    batchTimeoutMs?: number;
    maxBatchSize?: number;
    maxQueueSize?: number;
};
