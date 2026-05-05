/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useState } from 'react';
import { useWatchTransactionsByAddress } from '@ton/appkit-react';
import type { TransactionsUpdate } from '@ton/appkit';

export const UseWatchTransactionsByAddressExample = () => {
    // SAMPLE_START: USE_WATCH_TRANSACTIONS_BY_ADDRESS
    const address = 'UQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJKZ';
    const [lastUpdate, setLastUpdate] = useState<TransactionsUpdate | null>(null);

    useWatchTransactionsByAddress({
        address,
        onChange: (update) => {
            setLastUpdate(update);
        },
    });

    return (
        <div>
            {lastUpdate ? (
                <div>
                    New transactions for: {lastUpdate.address}
                    <br />
                    Count: {lastUpdate.transactions.length}
                </div>
            ) : (
                'Waiting for transactions...'
            )}
        </div>
    );
    // SAMPLE_END: USE_WATCH_TRANSACTIONS_BY_ADDRESS
};
