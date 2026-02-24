/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Base64String } from '@ton/appkit';
import { useSendTransaction } from '@ton/appkit-react';

export const UseSendTransactionExample = () => {
    // SAMPLE_START: USE_SEND_TRANSACTION
    const { mutate: sendTransaction, isPending, error, data } = useSendTransaction();

    const handleSendStructure = () => {
        // Send a transaction with a specific structure
        sendTransaction({
            validUntil: Math.floor(Date.now() / 1000) + 600, // 10 minutes from now
            messages: [
                {
                    address: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
                    amount: '1000000000', // 1 TON in nanotons
                    payload: 'te6cckEBAQEAAgAAAEysuc0=' as Base64String, // Optional payload (cell)
                },
            ],
        });
    };

    return (
        <div>
            <button onClick={handleSendStructure} disabled={isPending}>
                {isPending ? 'Sending...' : 'Send Transaction'}
            </button>
            {error && <div>Error: {error.message}</div>}
            {data && (
                <div>
                    <h4>Transaction Sent!</h4>
                    <p>BOC: {data.boc}</p>
                </div>
            )}
        </div>
    );
    // SAMPLE_END: USE_SEND_TRANSACTION
};
