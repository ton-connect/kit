/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { DefiManagerAPI } from './types';
import { DefiManagerError } from './errors';

export abstract class DefiManager<T> implements DefiManagerAPI<T> {
    protected providers: Map<string, T> = new Map();
    protected defaultProvider?: string;

    protected abstract createError(message: string, code: string, details?: unknown): DefiManagerError;

    /**
     * Register a swap provider
     * @param name - Unique name for the provider
     * @param provider - Provider instance
     */
    registerProvider(name: string, provider: T): void {
        this.providers.set(name, provider);

        if (!this.defaultProvider) {
            this.defaultProvider = name;
        }
    }

    /**
     * Set the default provider to use when none is specified
     * @param name - Provider name
     * @throws DefiManagerError if provider not found
     */
    setDefaultProvider(name: string): void {
        if (!this.providers.has(name)) {
            throw this.createError(`Provider '${name}' not registered`, DefiManagerError.PROVIDER_NOT_FOUND, {
                provider: name,
                registered: Array.from(this.providers.keys()),
            });
        }

        this.defaultProvider = name;
    }

    /**
     * Get a provider by name, or the default provider
     * @param name - Optional provider name
     * @returns Provider instance
     * @throws DefiManagerError if provider not found or no default set
     */
    getProvider(name?: string): T {
        const providerName = name || this.defaultProvider;

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
     * @param name - Provider name
     * @returns True if provider exists
     */
    hasProvider(name: string): boolean {
        return this.providers.has(name);
    }
}
