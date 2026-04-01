/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { DefiProvider } from '../api/interfaces';
import type { NetworkManager } from '../core/NetworkManager';

/**
 * Context passed to provider factory functions.
 */
export interface ProviderFactoryContext {
    networkManager: NetworkManager;
    ssr?: boolean;
}

/** Factory function that creates a provider from context */
export type ProviderFactory<T extends DefiProvider = DefiProvider> = (ctx: ProviderFactoryContext) => T;

/** A provider instance or a factory that creates one */
export type ProviderInput<T extends DefiProvider = DefiProvider> = T | ProviderFactory<T>;

/** Helper for creating typed provider factories */
export function createProvider<T extends DefiProvider = DefiProvider>(factory: ProviderFactory<T>): ProviderFactory<T> {
    return factory;
}

/** @internal Resolves a ProviderInput to a provider instance */
export function resolveProvider<T extends DefiProvider = DefiProvider>(
    input: ProviderInput<T>,
    ctx: ProviderFactoryContext,
): T {
    return typeof input === 'function' ? input(ctx) : input;
}
