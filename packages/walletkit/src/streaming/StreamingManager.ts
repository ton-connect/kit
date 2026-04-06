/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Network } from '../api/models';
import type { StreamingProvider, StreamingAPI } from '../api/interfaces';
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
import { resolveProvider } from '../types/factory';
import type { ProviderFactoryContext, ProviderInput } from '../types/factory';

const log = globalLogger.createChild('StreamingManager');

/**
 * Orchestrates streaming providers and routes watch calls to the correct provider by network.
 */
export class StreamingManager<E extends StreamingEvents = StreamingEvents> implements StreamingAPI {
    private createFactoryContext: () => ProviderFactoryContext<E>;
    private providers: Map<string, StreamingProvider> = new Map();
    private connectionChangeCallbacks: Map<string, Set<(connected: boolean) => void>> = new Map();
    private providerConnectionUnsubs: Map<string, () => void> = new Map();

    constructor(createFactoryContext: () => ProviderFactoryContext<E>) {
        this.createFactoryContext = createFactoryContext;
    }

    /**
     * Register a provider factory. The network is determined from the provider's network property.
     */
    registerProvider(input: ProviderInput<StreamingProvider>): void {
        const provider = resolveProvider(input, this.createFactoryContext());
        const networkId = String(provider.network.chainId);

        if (this.providers.has(networkId)) {
            log.warn(`Provider for network ${networkId} is already registered. Overriding.`);
            this.providerConnectionUnsubs.get(networkId)?.();
            this.providers.get(networkId)?.disconnect();
        }

        this.providers.set(networkId, provider);

        const unsub = provider.onConnectionChange((connected) => {
            this.emitConnectionChange(networkId, connected);
        });
        this.providerConnectionUnsubs.set(networkId, unsub);
    }

    /**
     * Check if a provider is registered for a specific network.
     */
    hasProvider(network: Network): boolean {
        return this.providers.has(String(network.chainId));
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
        const provider = this.providers.get(networkId);
        if (!provider) {
            throw new Error(`No streaming provider registered for network ${networkId}`);
        }
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
        this.providers.forEach((provider) => provider.disconnect());
    }

    /**
     * Subscribe to connection state changes for a specific network's provider.
     */
    onConnectionChange(network: Network, callback: (connected: boolean) => void): () => void {
        const networkId = String(network.chainId);
        let set = this.connectionChangeCallbacks.get(networkId);
        if (!set) {
            set = new Set();
            this.connectionChangeCallbacks.set(networkId, set);
        }
        set.add(callback);
        return () => {
            set.delete(callback);
            if (set.size === 0) {
                this.connectionChangeCallbacks.delete(networkId);
            }
        };
    }

    private emitConnectionChange(networkId: string, connected: boolean): void {
        this.connectionChangeCallbacks.get(networkId)?.forEach((cb) => cb(connected));
    }
}
