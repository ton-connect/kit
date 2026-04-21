/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type React from 'react';
import { CryptoOnrampWidget } from '@ton/appkit-react';
import type { AppkitUIToken } from '@ton/appkit-react';

import { Card, Layout } from '@/core/components';

const TOKENS: AppkitUIToken[] = [
    {
        id: 'ton',
        symbol: 'TON',
        name: 'Toncoin',
        decimals: 9,
        address: 'ton',
        logo: 'https://asset.ston.fi/img/EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c/c8d21a3d93f9b574381e0a8d8f16d48b325dd8f54ce172f599c1e9d6c62f03f7',
    },
    // {
    //     id: 'usdt',
    //     symbol: 'USDT',
    //     name: 'Tether USD',
    //     decimals: 6,
    //     address: 'UQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_p0p',
    //     rate: '1',
    //     logo: 'https://asset.ston.fi/img/EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs/1a87edfee9a28b05578853952e5effb8cc30af1e0fb90043aa2ce19dce490849',
    // },
];

export const OnrampPage: React.FC = () => {
    return (
        <Layout title="Buy">
            <Card className="w-full max-w-[434px] mx-auto">
                <CryptoOnrampWidget tokens={TOKENS} defaultTokenId="ton" />
            </Card>
        </Layout>
    );
};
