/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useState } from 'react';
import { useWatchTransactions } from '@ton/appkit-react';
import type { TransactionsUpdate } from '@ton/appkit';

export const UseWatchTransactionsExample = () => {
    // SAMPLE_START: USE_WATCH_TRANSACTIONS
    const [lastUpdate, setLastUpdate] = useState<TransactionsUpdate | null>(null);

    useWatchTransactions({
        onChange: (update) => {
            setLastUpdate(update);
        },
    });

    return (
        <div>
            {lastUpdate ? (
                <div>
                    Last update for: {lastUpdate.address}
                    <br />
                    Transactions count: {lastUpdate.transactions.length}
                </div>
            ) : (
                'Waiting for transactions...'
            )}
        </div>
    );
    // SAMPLE_END: USE_WATCH_TRANSACTIONS
};
