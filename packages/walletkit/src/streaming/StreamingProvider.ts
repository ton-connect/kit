/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { BalanceUpdate, TransactionsUpdate, JettonUpdate } from './types';

export interface StreamingProviderListener {
    onBalanceUpdate: (update: BalanceUpdate) => void;
    onTransactions: (update: TransactionsUpdate) => void;
    onJettonsUpdate: (update: JettonUpdate) => void;
}

export interface StreamingProvider {
    /**
     * Watch account balance changes.
     */
    watchBalance(address: string): void;
    unwatchBalance(address: string): void;

    /**
     * Watch transactions for an address.
     */
    watchTransactions(address: string): void;
    unwatchTransactions(address: string): void;

    /**
     * Watch jetton changes for an address.
     */
    watchJettons(address: string): void;
    unwatchJettons(address: string): void;

    /**
     * Close the connection.
     */
    close(): void;
}
