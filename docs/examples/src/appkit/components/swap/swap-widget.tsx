/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Network } from '@ton/appkit';
import { SwapWidget } from '@ton/appkit-react';
import type { AppkitUIToken } from '@ton/appkit-react';

const tokens: AppkitUIToken[] = [
    {
        id: 'ton',
        symbol: 'TON',
        name: 'Toncoin',
        decimals: 9,
        address: 'ton',
        logo: 'https://ton.org/download/ton_symbol.png',
        network: Network.mainnet(),
    },
    {
        id: 'usdt',
        symbol: 'USDT',
        name: 'Tether USD',
        decimals: 6,
        address: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs',
        network: Network.mainnet(),
    },
];

export const SwapWidgetExample = () => {
    // SAMPLE_START: SWAP_WIDGET
    // Make sure a swap provider (e.g. DeDust / Omniston) is registered on AppKit.
    return <SwapWidget tokens={tokens} defaultFromSymbol="TON" defaultToSymbol="USDT" defaultSlippage={100} />;
    // SAMPLE_END: SWAP_WIDGET
};
