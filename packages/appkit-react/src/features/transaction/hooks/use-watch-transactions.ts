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

export interface UseWatchTransactionsParameters {
    onChange?: (update: TransactionsUpdate) => void;
}

/**
 * Hook to watch transaction updates of the currently selected wallet in real-time.
 */
export const useWatchTransactions = (parameters: UseWatchTransactionsParameters = {}): void => {
    const address = useAddress();
    const network = useNetwork();

    useWatchTransactionsByAddress({ ...parameters, address, network });
};
