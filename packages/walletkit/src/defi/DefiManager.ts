/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { DefiManagerAPI } from '../api/interfaces';
import type { DefiProvider } from '../api/interfaces';
import { DefiManagerError } from './errors';

export abstract class DefiManager<T extends DefiProvider> implements DefiManagerAPI<T> {
    protected providers: Map<string, T> = new Map();
    protected defaultProviderId?: string;

    protected abstract createError(message: string, code: string, details?: unknown): DefiManagerError;

    /**
     * Register a swap provider
     * @param name - Unique name for the provider
     * @param provider - Provider instance
     */
    /**
     * Register a swap provider
     * @param provider - Provider instance
     */
    registerProvider(provider: T): void {
        const providerId = provider.providerId;

        if (!providerId) {
            throw this.createError('Provider must have a providerId', DefiManagerError.INVALID_PROVIDER);
        }

        this.providers.set(providerId, provider);

        if (!this.defaultProviderId) {
            this.defaultProviderId = providerId;
        }
    }

    /**
     * Set the default provider to use when none is specified
     * @param providerId - Provider name
     * @throws DefiManagerError if provider not found
     */
    setDefaultProvider(providerId: string): void {
        if (!this.providers.has(providerId)) {
            throw this.createError(`Provider '${providerId}' not registered`, DefiManagerError.PROVIDER_NOT_FOUND, {
                provider: providerId,
                registered: Array.from(this.providers.keys()),
            });
        }

        this.defaultProviderId = providerId;
    }

    /**
     * Get a provider by name, or the default provider
     * @param providerId - Optional provider name
     * @returns Provider instance
     * @throws DefiManagerError if provider not found or no default set
     */
    getProvider(providerId?: string): T {
        const providerName = providerId || this.defaultProviderId;

        if (!providerName) {
            throw this.createError(
                'No default provider set. Register a provider first.',
                DefiManagerError.NO_DEFAULT_PROVIDER,
            );
        }

        const provider = this.providers.get(providerName);
        if (!provider) {
            throw this.createError(`Provider '${providerName}' not found`, DefiManagerError.PROVIDER_NOT_FOUND, {
                provider: providerName,
                registered: Array.from(this.providers.keys()),
            });
        }

        return provider;
    }

    /**
     * Get list of registered provider names
     * @returns Array of provider names
     */
    getRegisteredProviders(): string[] {
        return Array.from(this.providers.keys());
    }

    /**
     * Check if a provider is registered
     * @param providerId - Provider id
     * @returns True if provider exists
     */
    hasProvider(providerId: string): boolean {
        return this.providers.has(providerId);
    }
}
