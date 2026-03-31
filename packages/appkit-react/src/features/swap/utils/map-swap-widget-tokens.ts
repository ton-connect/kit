/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { toNonBounceableAddress } from '@ton/appkit';

import type { SwapWidgetToken } from '../components/swap-widget-provider';

export const mapSwapWidgetTokens = (tokens: SwapWidgetToken[]): SwapWidgetToken[] => {
    return tokens.reduce((acc, token) => {
        const friendlyAddress = toNonBounceableAddress(token.address);

        if (!friendlyAddress) return acc;

        const mappedToken = {
            ...token,
            address: friendlyAddress,
        };

        acc.push(mappedToken);

        return acc;
    }, [] as SwapWidgetToken[]);
};
