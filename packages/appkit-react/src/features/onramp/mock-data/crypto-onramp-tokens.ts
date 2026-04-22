/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { CryptoOnrampToken } from '../types';

/**
 * Target tokens (what the user is buying on TON) for the crypto onramp widget.
 *
 * Addresses are in the raw form expected by the onramp provider.
 */
export const CRYPTO_ONRAMP_TARGET_TOKENS: CryptoOnrampToken[] = [
    {
        id: 'ton',
        symbol: 'TON',
        name: 'Toncoin',
        decimals: 9,
        address: '0x0000000000000000000000000000000000000000',
        logo: 'https://pretty-picture-g2.s3.eu-central-1.amazonaws.com/ton_ebae1444e3.svg',
    },
    {
        id: 'usdt-ton',
        symbol: 'USDT',
        name: 'Tether',
        decimals: 6,
        address: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs',
        logo: 'https://pretty-picture-g2.s3.eu-central-1.amazonaws.com/usdt20_9a8c677b99_c67aed2f04.svg',
    },
];
