/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Address } from '@ton/core';

import { getErrorMessage } from '../errors/get-error-message';

export const toNonBounceableAddress = (address?: Address | string | null): string => {
    if (!address) {
        throw new Error(`Address is empty`);
    }

    if (address instanceof Address) {
        return address.toString({ bounceable: false });
    }

    try {
        return Address.parse(address).toString({ bounceable: false });
    } catch (e) {
        throw new Error(`Can not convert to non-bounceable address from "${address}". Error: ${getErrorMessage(e)}`);
    }
};

export const tryToNonBounceableAddress = (address?: Address | string | null): string | undefined => {
    try {
        return toNonBounceableAddress(address);
    } catch {
        return undefined;
    }
};
