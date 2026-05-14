/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type React from 'react';
import { CryptoOnrampWidget } from '@ton/appkit-react';
import type { CryptoOnrampToken, CryptoPaymentMethod } from '@ton/appkit-react';

import { Card, Layout } from '@/core/components';

const TOKENS: CryptoOnrampToken[] = [
    // {
    //     id: 'ton',
    //     symbol: 'TON',
    //     name: 'Toncoin',
    //     decimals: 9,
    //     address: '0x0000000000000000000000000000000000000000',
    //     logo: 'https://asset.ston.fi/img/EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c/c8d21a3d93f9b574381e0a8d8f16d48b325dd8f54ce172f599c1e9d6c62f03f7',
    // },
    {
        id: 'usdt-ton',
        symbol: 'USDT',
        name: 'Tether USD',
        decimals: 6,
        address: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs',
        logo: 'https://asset.ston.fi/img/EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs/1a87edfee9a28b05578853952e5effb8cc30af1e0fb90043aa2ce19dce490849',
    },
];

const PAYMENT_METHODS: CryptoPaymentMethod[] = [
    // {
    //     id: 'usdc-base',
    //     symbol: 'USDC',
    //     name: 'USD Coin',
    //     network: 'Base',
    //     networkId: '8453',
    //     decimals: 6,
    //     address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    //     logo: 'https://assets.coingecko.com/coins/images/6319/standard/USDC.png?1769615602',
    //     networkLogo: 'https://avatars.githubusercontent.com/u/108554348?s=280&v=4',
    // },
    // {
    //     id: 'usdt-bsc',
    //     symbol: 'USDT',
    //     name: 'Tether',
    //     network: 'BSC',
    //     networkId: '56',
    //     decimals: 18,
    //     address: '0x55d398326f99059fF775485246999027B3197955',
    //     logo: 'https://asset.ston.fi/img/EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs/1a87edfee9a28b05578853952e5effb8cc30af1e0fb90043aa2ce19dce490849',
    //     networkLogo: 'https://assets.coingecko.com/coins/images/825/standard/bnb-icon2_2x.png',
    // },
    {
        id: 'usdt0-arbitrum',
        symbol: 'USDT0',
        name: 'Tether USD0',
        chain: 'eip155:42161',
        decimals: 6,
        address: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9',
        logo: 'https://cdn.layerswap.io/layerswap/currencies/usdt0.png',
    },
];

export const OnrampPage: React.FC = () => {
    return (
        <Layout title="Buy">
            <Card className="w-full max-w-[422px] mx-auto">
                <CryptoOnrampWidget
                    tokens={TOKENS}
                    defaultTokenId="usdt-ton"
                    paymentMethods={PAYMENT_METHODS}
                    defaultMethodId="usdc-base"
                />
            </Card>
        </Layout>
    );
};
