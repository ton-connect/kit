/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { SendTonButton } from '@ton/appkit-react';

export const SendTonButtonExample = () => {
    // SAMPLE_START: SEND_TON_BUTTON
    return (
        <SendTonButton
            recipientAddress="EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c"
            amount="1000000000" // 1 TON
            comment="Hello from AppKit"
            onSuccess={(result) => console.log('Transaction sent:', result)}
            onError={(error) => console.error('Transaction failed:', error)}
        />
    );
    // SAMPLE_END: SEND_TON_BUTTON
};
