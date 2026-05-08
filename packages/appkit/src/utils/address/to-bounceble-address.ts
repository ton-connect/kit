/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Address } from '@ton/core';

import { getErrorMessage } from '../errors/get-error-message';

export const toBounceableAddress = (address?: Address | string | null): string => {
    if (!address) {
        throw new Error(`Address is empty`);
    }

    if (address instanceof Address) {
        return address.toString({ bounceable: true });
    }

    try {
        return Address.parse(address).toString({ bounceable: true });
    } catch (e) {
        throw new Error(`Can not convert to bounceble address from "${address}". Error: ${getErrorMessage(e)}`);
    }
};
