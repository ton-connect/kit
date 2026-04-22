/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { DefiManagerAPI } from '../api/interfaces';
import type { DefiProvider } from '../api/interfaces';
import { resolveProvider } from '../types';
import type { ProviderInput } from '../types';
import type { ProviderFactoryContext } from '../types/factory';
import { DefiManagerError } from './errors';
import type { SharedKitEvents } from '../types/emitter';
import type { EventEmitter } from '../core/EventEmitter';

export abstract class DefiManager<
    T extends DefiProvider,
    E extends SharedKitEvents = SharedKitEvents,
> implements DefiManagerAPI<T> {
    public createFactoryContext: () => ProviderFactoryContext<E>;

    protected providers: T[] = [];
    protected defaultProviderId?: string;
    protected abstract createError(message: string, code: string, details?: unknown): DefiManagerError;
    protected eventEmitter: EventEmitter<E>;

    constructor(createFactoryContext: () => ProviderFactoryContext<E>) {
        this.createFactoryContext = createFactoryContext;
        this.eventEmitter = createFactoryContext().eventEmitter;
    }

    /**
     * Register a provider. If another provider with the same id is already registered,
     * it is removed first and replaced by the new instance. Emits `provider:registered`,
     * and `provider:default-changed` when the first provider becomes the default.
     * @param input - Provider instance or factory that produces one
     * @throws DefiManagerError if the resolved provider has no providerId
     */
    registerProvider(input: ProviderInput<T>): void {
        const provider = resolveProvider(input, this.createFactoryContext());
        const providerId = provider.providerId;

        if (!providerId) {
            throw this.createError('Provider must have a providerId', DefiManagerError.INVALID_PROVIDER);
        }

        const oldProvider = this.providers.find((p) => p.providerId === providerId);
        if (oldProvider) {
            this.removeProvider(oldProvider);
        }

        this.providers = [...this.providers, provider];

        this.eventEmitter.emit('provider:registered', { providerId, type: provider.type }, 'defi-manager');

        if (!this.defaultProviderId) {
            this.defaultProviderId = providerId;
            this.eventEmitter.emit('provider:default-changed', { providerId, type: provider.type }, 'defi-manager');
        }
    }

    /**
     * Remove a previously registered provider. No-op if the provider is not registered.
     * The provider is matched by its `providerId`, so any instance with the same id will match.
     * @param provider - Provider instance to remove
     */
    removeProvider(provider: T): void {
        const oldProvider = this.providers.find((p) => p.providerId === provider.providerId);

        if (oldProvider) {
            this.providers = this.providers.filter((p) => p !== oldProvider);
        }
    }

    /**
     * Set the default provider to use when none is specified
     * @param providerId - Provider name
     * @throws DefiManagerError if provider not found
     */
    setDefaultProvider(providerId: string): void {
        const provider = this.providers.find((p) => p.providerId === providerId);

        if (!provider) {
            throw this.createError(`Provider '${providerId}' not found`, DefiManagerError.PROVIDER_NOT_FOUND, {
                provider: providerId,
                registered: this.providers.map((p) => p.providerId),
            });
        }

        this.defaultProviderId = providerId;
        this.eventEmitter.emit('provider:default-changed', { providerId, type: provider.type }, 'defi-manager');
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

        const provider = this.providers.find((p) => p.providerId === providerName);
        if (!provider) {
            throw this.createError(`Provider '${providerName}' not found`, DefiManagerError.PROVIDER_NOT_FOUND, {
                provider: providerName,
                registered: this.providers.map((p) => p.providerId),
            });
        }

        return provider;
    }

    /**
     * Get all registered providers. The returned array keeps a stable reference
     * until the provider list changes, so it can be safely used with React
     * subscription APIs like `useSyncExternalStore`.
     */
    getProviders(): T[] {
        return this.providers;
    }

    /**
     * Check if a provider is registered
     * @param providerId - Provider id
     * @returns True if provider exists
     */
    hasProvider(providerId: string): boolean {
        return this.providers.some((p) => p.providerId === providerId);
    }
}
