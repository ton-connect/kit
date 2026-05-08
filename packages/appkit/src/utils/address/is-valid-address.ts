/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Address } from '@ton/core';

import type { UserFriendlyAddress } from '../../types/primitives';
import { isString } from '../predicate/is-string';

export const isValidAddress = (address: unknown): address is string => {
    if (typeof address !== 'string') {
        return false;
    }

    try {
        Address.parse(address);
    } catch (_) {
        return false;
    }

    return true;
};

export const isFriendlyTonAddress = (address: unknown): address is UserFriendlyAddress => {
    if (!isString(address)) {
        return false;
    }

    try {
        Address.parseFriendly(address);
    } catch (_) {
        return false;
    }

    return true;
};
