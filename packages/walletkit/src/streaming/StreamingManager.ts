/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Network } from '../api/models';
import type { StreamingProvider, StreamingProviderFactory, StreamingAPI } from '../api/interfaces';
import type {
    JettonUpdate,
    BalanceUpdate,
    TransactionsUpdate,
    StreamingUpdate,
    StreamingWatchType,
    StreamingEvents,
} from '../api/models';
import { globalLogger } from '../core/Logger';
import { asAddressFriendly } from '../utils';
import type { ProviderFactoryContext } from '../types/factory';

const log = globalLogger.createChild('StreamingManager');

/**
 * Orchestrates streaming providers and routes watch calls to the correct provider by network.
 */
export class StreamingManager<E extends StreamingEvents = StreamingEvents> implements StreamingAPI {
    private createFactoryContext: () => ProviderFactoryContext<E>;
    private providers: Map<string, StreamingProvider> = new Map();
    private providerFactories: Map<string, StreamingProviderFactory> = new Map();

    constructor(createFactoryContext: () => ProviderFactoryContext<E>) {
        this.createFactoryContext = createFactoryContext;
    }

    /**
     * Register a provider factory for a specific network.
     */
    registerProvider(network: Network, factory: StreamingProviderFactory): void {
        const networkId = String(network.chainId);

        if (this.providerFactories.has(networkId)) {
            log.warn(`Provider factory for network ${networkId} is already registered. Overriding.`);
        }

        this.providerFactories.set(networkId, factory);
    }

    /**
     * Check if a provider factory is registered for a specific network.
     */
    hasProvider(network: Network): boolean {
        return this.providerFactories.has(String(network.chainId));
    }

    /**
     * Watch account balance changes.
     */
    watchBalance(network: Network, address: string, onChange: (update: BalanceUpdate) => void): () => void {
        return this.getProvider(network).watchBalance(asAddressFriendly(address), onChange);
    }

    /**
     * Watch transactions for an address.
     */
    watchTransactions(network: Network, address: string, onChange: (update: TransactionsUpdate) => void): () => void {
        return this.getProvider(network).watchTransactions(asAddressFriendly(address), onChange);
    }

    /**
     * Watch jetton changes for an address.
     */
    watchJettons(network: Network, address: string, onChange: (update: JettonUpdate) => void): () => void {
        return this.getProvider(network).watchJettons(asAddressFriendly(address), onChange);
    }

    /**
     * Bulk watch multiple types for an address.
     */
    watch(
        network: Network,
        address: string,
        types: Exclude<StreamingWatchType, 'trace'>[],
        onUpdate: (type: StreamingWatchType, update: StreamingUpdate) => void,
    ): () => void {
        const unwatchers = types.map((type) => {
            switch (type) {
                case 'balance':
                    return this.watchBalance(network, address, (u) => onUpdate('balance', u));
                case 'transactions':
                    return this.watchTransactions(network, address, (u) => onUpdate('transactions', u));
                case 'jettons':
                    return this.watchJettons(network, address, (u) => onUpdate('jettons', u));
                default:
                    return () => {};
            }
        });

        return () => unwatchers.forEach((unwatch) => unwatch());
    }

    private getProvider(network: Network): StreamingProvider {
        const networkId = String(network.chainId);
        let provider = this.providers.get(networkId);
        if (provider) return provider;

        const factory = this.providerFactories.get(networkId);
        if (!factory) {
            throw new Error(`No streaming provider registered for network ${networkId}`);
        }

        log.info('Creating new streaming provider', { networkId });

        provider = factory(this.createFactoryContext(), network);
        this.providers.set(networkId, provider);
        return provider;
    }

    /**
     * Open (or reopen) connections for all providers that have been instantiated.
     */
    connect(): void {
        this.providers.forEach((provider) => provider.connect());
    }

    /**
     * Close all active streaming connections without dropping subscriptions.
     * Call connect() to resume.
     */
    disconnect(): void {
        this.providers.forEach((provider) => provider.close());
    }

    /**
     * Close all active streaming connections and remove all providers.
     */
    shutdown(): void {
        this.providers.forEach((provider) => provider.close());
        this.providers.clear();
    }
}
