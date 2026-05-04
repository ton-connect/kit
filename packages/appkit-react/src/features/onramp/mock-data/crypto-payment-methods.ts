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
        id: 'usdt0-arbitrum',
        symbol: 'USDT0',
        name: 'Tether USD0',
        network: 'Arbitrum One',
        networkId: '42161',
        decimals: 6,
        address: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9',
        logo: 'https://cdn.layerswap.io/layerswap/currencies/usdt0.png',
        networkLogo: 'https://cdn.layerswap.io/layerswap/networks/arbitrum_mainnet.png',
    },
];
