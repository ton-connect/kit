/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { CryptoPaymentMethod } from '../types';

/**
 * Payment methods (source assets) supported by the current crypto onramp pipeline.
 *
 * Only EVM sources are included — non-EVM chains require a register-tx flow
 * that the provider does not implement yet.
 */
export const CRYPTO_PAYMENT_METHODS: CryptoPaymentMethod[] = [
    {
        id: 'usdc-base',
        symbol: 'USDC',
        name: 'USD Coin',
        network: 'Base',
        networkId: '8453',
        decimals: 6,
        address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        logo: 'https://assets.coingecko.com/coins/images/6319/standard/USDC.png?1769615602',
        networkLogo: 'https://assets.coingecko.com/coins/images/30746/standard/base.png',
    },
    {
        id: 'usdt-bsc',
        symbol: 'USDT',
        name: 'Tether',
        network: 'BSC',
        networkId: '56',
        decimals: 18,
        address: '0x55d398326f99059fF775485246999027B3197955',
        logo: 'https://asset.ston.fi/img/EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs/1a87edfee9a28b05578853952e5effb8cc30af1e0fb90043aa2ce19dce490849',
        networkLogo: 'https://assets.coingecko.com/coins/images/825/standard/bnb-icon2_2x.png',
    },
];
