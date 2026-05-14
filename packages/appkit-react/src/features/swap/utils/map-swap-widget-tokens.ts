/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { tryToNonBounceableAddress } from '@ton/appkit';

import type { AppkitUIToken } from '../../../types/appkit-ui-token';

export const mapSwapWidgetTokens = (tokens: AppkitUIToken[]): AppkitUIToken[] => {
    const mapped = tokens.reduce((acc, token) => {
        if (token.address === 'ton') {
            acc.push(token);

            return acc;
        }

        const friendlyAddress = tryToNonBounceableAddress(token.address);

        if (!friendlyAddress) return acc;

        acc.push({
            ...token,
            address: friendlyAddress,
        });

        return acc;
    }, [] as AppkitUIToken[]);

    return mapped;
};
