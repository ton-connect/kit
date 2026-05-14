/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { CryptoOnrampToken, CryptoPaymentMethod } from '@ton/appkit-react';

export const ONRAMP_TOKENS: CryptoOnrampToken[] = [
    {
        id: 'usdt-ton',
        symbol: 'USDT',
        name: 'Tether USD',
        decimals: 6,
        address: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs',
        logo: 'https://asset.ston.fi/img/EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs/1a87edfee9a28b05578853952e5effb8cc30af1e0fb90043aa2ce19dce490849',
    },
];

export const ONRAMP_PAYMENT_METHODS: CryptoPaymentMethod[] = [
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

export const ONRAMP_DEFAULT_TOKEN_ID = 'usdt-ton';
export const ONRAMP_DEFAULT_METHOD_ID = 'usdt0-arbitrum';
