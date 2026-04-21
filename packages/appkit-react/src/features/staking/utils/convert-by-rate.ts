/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { truncateDecimals } from '@ton/appkit';

export const convertByRate = (amount: string, exchangeRate?: string, decimals?: number) => {
    if (!exchangeRate || !decimals) {
        return '';
    }

    return truncateDecimals((Number(amount) * Number(exchangeRate)).toString(), decimals);
};
