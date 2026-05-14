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
import { TokenSelectModal } from '@ton/appkit-react';
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

export const TokenSelectModalExample = () => {
    const [open, setOpen] = useState(true);
    // SAMPLE_START: TOKEN_SELECT_MODAL
    return (
        <TokenSelectModal
            open={open}
            onClose={() => setOpen(false)}
            tokens={tokens}
            title="Select a token"
            searchPlaceholder="Search by name or address"
            onSelect={(token) => {
                console.log('Picked:', token.symbol);
                setOpen(false);
            }}
        />
    );
    // SAMPLE_END: TOKEN_SELECT_MODAL
};
