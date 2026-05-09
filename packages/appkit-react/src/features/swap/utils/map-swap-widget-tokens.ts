/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { toNonBounceableAddress } from '@ton/appkit';

import type { AppkitUIToken } from '../../../types/appkit-ui-token';

export const mapSwapWidgetTokens = (tokens: AppkitUIToken[]): AppkitUIToken[] => {
    const mapped = tokens.reduce((acc, token) => {
        if (token.address === 'ton') {
            acc.push({ ...token, address: 'ton' });

            return acc;
        }

        try {
            const friendlyAddress = toNonBounceableAddress(token.address);

            acc.push({
                ...token,
                address: friendlyAddress,
            });
        } catch {
            // skip tokens with invalid addresses
        }

        return acc;
    }, [] as AppkitUIToken[]);

    return mapped;
};
