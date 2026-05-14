/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/* eslint-disable no-console */

import { useState } from 'react';
import { Network } from '@ton/appkit';
import { SwapField } from '@ton/appkit-react';
import type { AppkitUIToken } from '@ton/appkit-react';

const ton: AppkitUIToken = {
    id: 'ton',
    symbol: 'TON',
    name: 'Toncoin',
    decimals: 9,
    address: 'ton',
    logo: 'https://ton.org/download/ton_symbol.png',
    network: Network.mainnet(),
};

export const SwapFieldExample = () => {
    const [amount, setAmount] = useState('');
    // SAMPLE_START: SWAP_FIELD
    return (
        <SwapField
            type="pay"
            amount={amount}
            onAmountChange={setAmount}
            token={ton}
            balance="12.5"
            onMaxClick={() => setAmount('12.5')}
            onTokenSelectorClick={() => console.log('Open token picker')}
        />
    );
    // SAMPLE_END: SWAP_FIELD
};
