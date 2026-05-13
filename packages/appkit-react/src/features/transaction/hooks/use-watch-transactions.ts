/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { TransactionsUpdate } from '@ton/appkit';

import { useAddress } from '../../wallets/hooks/use-address';
import { useNetwork } from '../../network/hooks/use-network';
import { useWatchTransactionsByAddress } from './use-watch-transactions-by-address';

/**
 * Parameters accepted by {@link useWatchTransactions}.
 *
 * @public
 * @category Type
 * @section Transactions
 */
export interface UseWatchTransactionsParameters {
    /** Callback fired on every transactions update from the streaming provider. */
    onChange?: (update: TransactionsUpdate) => void;
}

/**
 * Subscribe to incoming-transaction events for the currently selected wallet (use {@link useWatchTransactionsByAddress} for a fixed address). Auto-rebinds when the user connects, switches or disconnects.
 *
 * @param parameters - {@link UseWatchTransactionsParameters} Update callback.
 *
 * @sample docs/examples/src/appkit/hooks/transaction#USE_WATCH_TRANSACTIONS
 *
 * @public
 * @category Hook
 * @section Transactions
 */
export const useWatchTransactions = (parameters: UseWatchTransactionsParameters = {}): void => {
    const address = useAddress();
    const network = useNetwork();

    useWatchTransactionsByAddress({ ...parameters, address, network });
};
