/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Base64String } from '@ton/appkit';
import { Transaction } from '@ton/appkit-react';
import { beginCell } from '@ton/core';

export const TransactionExample = () => {
    // SAMPLE_START: TRANSACTION
    return (
        <Transaction
            getTransactionRequest={async () => ({
                validUntil: Math.floor(Date.now() / 1000) + 600,
                messages: [
                    {
                        address: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c', // Recipient address
                        amount: '100000000', // 0.1 TON
                        payload: beginCell()
                            .storeUint(0, 32)
                            .storeStringTail('Hello')
                            .endCell()
                            .toBoc()
                            .toString('base64') as Base64String,
                    },
                ],
            })}
            text="Send Transaction"
            onSuccess={(result) => {
                console.log('Transaction sent:', result);
            }}
            onError={(error) => {
                console.error('Transaction failed:', error);
            }}
        />
    );
    // SAMPLE_END: TRANSACTION
};
