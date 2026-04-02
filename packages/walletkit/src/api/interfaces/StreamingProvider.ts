/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { BaseProvider, BalanceUpdate, TransactionsUpdate, JettonUpdate, Network } from '../models';
import type { ProviderFactoryContext } from '../../types/factory';

export interface StreamingProvider extends BaseProvider {
    readonly type: 'streaming';

    /**
     * Watch account balance changes. Returns an unsubscribe function.
     */
    watchBalance(address: string, onChange: (update: BalanceUpdate) => void): () => void;

    /**
     * Watch transactions for an address. Returns an unsubscribe function.
     */
    watchTransactions(address: string, onChange: (update: TransactionsUpdate) => void): () => void;

    /**
     * Watch jetton changes for an address. Returns an unsubscribe function.
     */
    watchJettons(address: string, onChange: (update: JettonUpdate) => void): () => void;

    /**
     * Close the connection without dropping subscriptions.
     */
    close(): void;

    /**
     * Connect (or reconnect) and resume all active subscriptions.
     */
    connect(): void;
}

export type StreamingProviderFactory = (ctx: ProviderFactoryContext, network: Network) => StreamingProvider;
