/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { StreamingProviderFactory } from './StreamingProvider';
import type {
    Network,
    BalanceUpdate,
    TransactionsUpdate,
    JettonUpdate,
    StreamingUpdate,
    StreamingWatchType,
} from '../models';

export interface StreamingAPI {
    /**
     * Check if a provider factory is registered for a specific network.
     */
    hasProvider(network: Network): boolean;

    /**
     * Register a provider factory. The network is determined from the factory's provider.
     */
    registerProvider(factory: StreamingProviderFactory): void;

    /**
     * Watch account balance changes.
     */
    watchBalance(network: Network, address: string, onChange: (update: BalanceUpdate) => void): () => void;

    /**
     * Watch transactions for an address.
     */
    watchTransactions(network: Network, address: string, onChange: (update: TransactionsUpdate) => void): () => void;

    /**
     * Watch jetton changes for an address.
     */
    watchJettons(network: Network, address: string, onChange: (jetton: JettonUpdate) => void): () => void;

    /**
     * Bulk watch multiple types for an address.
     */
    watch(
        network: Network,
        address: string,
        types: Exclude<StreamingWatchType, 'trace'>[],
        onUpdate: (type: StreamingWatchType, update: StreamingUpdate) => void,
    ): () => void;

    /**
     * Open (or reopen) connections for all registered providers.
     */
    connect(): void;

    /**
     * Close all active streaming connections without dropping subscriptions.
     */
    disconnect(): void;

    /**
     * Subscribe to connection state changes for a specific network's provider.
     */
    onConnectionChange(network: Network, callback: (connected: boolean) => void): () => void;
}
