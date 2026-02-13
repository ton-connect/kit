/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { SendJettonButton } from '@ton/appkit-react';

export const SendJettonButtonExample = () => {
    // SAMPLE_START: SEND_JETTON_BUTTON
    return (
        <SendJettonButton
            recipientAddress="EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c"
            amount="5000000" // 5 USDT
            comment="Payment for services"
            jetton={{
                address: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs', // USDT
                symbol: 'USDT',
                decimals: 6,
            }}
            onSuccess={(result) => console.log('Transaction sent:', result)}
            onError={(error) => console.error('Transaction failed:', error)}
        />
    );
    // SAMPLE_END: SEND_JETTON_BUTTON
};
