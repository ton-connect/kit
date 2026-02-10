/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { DefiProvider } from './DefiProvider';

/**
 * Swap API interface exposed by SwapManager
 */
export interface DefiManagerAPI<T extends DefiProvider> {
    /**
     * Register a new provider
     * @param provider Provider instance (must have providerId)
     */
    registerProvider(provider: T): void;

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
     * Get list of all registered provider ids
     */
    getRegisteredProviders(): string[];

    /**
     * Check if a provider is registered
     * @param providerId Provider identifier
     */
    hasProvider(providerId: string): boolean;
}
