/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ProviderFactoryContext, ProviderInput } from '@ton/walletkit';

import type { CustomProvider } from '../types/custom-provider';

export class CustomProvidersManager {
    private readonly providers = new Map<string, CustomProvider>();
    private readonly factoryContext: () => ProviderFactoryContext;

    constructor(factoryContext: () => ProviderFactoryContext) {
        this.factoryContext = factoryContext;
    }

    registerProvider<T extends CustomProvider>(input: ProviderInput<T>): void {
        const provider = typeof input === 'function' ? input(this.factoryContext()) : input;
        this.providers.set(provider.providerId, provider);
    }

    getProvider<T extends CustomProvider>(id: string): T | undefined {
        return this.providers.get(id) as T | undefined;
    }

    hasProvider(id: string): boolean {
        return this.providers.has(id);
    }

    getRegisteredProviders(): string[] {
        return Array.from(this.providers.keys());
    }
}
