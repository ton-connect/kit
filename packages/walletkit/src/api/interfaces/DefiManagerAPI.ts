/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ProviderInput } from '../../types';
import type { ProviderFactoryContext } from '../../types/factory';
import type { DefiProvider } from './DefiProvider';

/**
 * Swap API interface exposed by SwapManager
 */
export interface DefiManagerAPI<T extends DefiProvider> {
    /** Build a fresh {@link ProviderFactoryContext} the manager hands to provider factories at registration time. */
    createFactoryContext(): ProviderFactoryContext;
    /**
     * Register a new provider. If a provider with the same id is already registered, it is replaced.
     * @param provider Provider instance or factory (must produce a provider with providerId)
     */
    registerProvider(provider: ProviderInput<T>): void;

    /**
     * Remove a previously registered provider. No-op if the provider was not registered.
     * @param provider Provider instance to remove (matched by providerId)
     */
    removeProvider(provider: T): void;

    /**
     * Set the default provider
     * @param providerId Provider identifier
     */
    setDefaultProvider(providerId: string): void;

    /**
     * Get a registered provider
     * @param providerId Provider identifier (optional, returns default if not specified)
     */
    getProvider(providerId?: string): T;

    /**
     * Get all registered providers.
     * The returned array keeps a stable reference until the provider list changes.
     */
    getProviders(): T[];

    /**
     * Check if a provider is registered
     * @param providerId Provider identifier
     */
    hasProvider(providerId: string): boolean;
}
