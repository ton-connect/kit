/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React from 'react';
import { Transaction } from '@ton/appkit-ui-react';
import { beginCell } from '@ton/core';
import type { Base64String } from '@ton/walletkit';

export const TransactionExample = () => {
    return (
        <div>
            {/* Send TON */}
            <Transaction
                getTransactionRequest={async () => ({
                    validUntil: Math.floor(Date.now() / 1000) + 600,
                    messages: [
                        {
                            address: 'UQ...',
                            amount: '1.5',
                        },
                    ],
                })}
            />

            {/* Send Jetton */}
            <Transaction
                getTransactionRequest={async () => ({
                    validUntil: Math.floor(Date.now() / 1000) + 600,
                    messages: [
                        {
                            address: 'EQ...', // Jetton wallet address
                            amount: '0.05',
                            payload: beginCell().endCell().toBoc().toString('base64') as Base64String, // Jetton transfer payload
                        },
                    ],
                })}
                text="Send Jetton"
            />
        </div>
    );
};
