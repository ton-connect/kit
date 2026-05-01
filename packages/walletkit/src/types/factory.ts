/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { BaseProvider } from '../api/models';
import type { NetworkManager } from '../core/NetworkManager';
import type { EventEmitter } from '../core/EventEmitter';
import type { SharedKitEvents } from './emitter';

/**
 * Context passed to provider factory functions.
 */
export interface ProviderFactoryContext<Events extends SharedKitEvents = SharedKitEvents> {
    networkManager: NetworkManager;
    eventEmitter: EventEmitter<Events>;
    ssr?: boolean;
}

/** Factory function that creates a provider from context */
export type ProviderFactory<T extends BaseProvider = BaseProvider> = (ctx: ProviderFactoryContext) => T;

/** A provider instance or a factory that creates one */
export type ProviderInput<T extends BaseProvider = BaseProvider> = T | ProviderFactory<T>;

/** Helper for creating typed provider factories */
export function createProvider<T extends BaseProvider = BaseProvider>(factory: ProviderFactory<T>): ProviderFactory<T> {
    return factory;
}

/** @internal Resolves a ProviderInput to a provider instance */
export function resolveProvider<T extends BaseProvider = BaseProvider>(
    input: ProviderInput<T>,
    ctx: ProviderFactoryContext,
): T {
    return typeof input === 'function' ? input(ctx) : input;
}
