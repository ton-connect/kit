/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Address } from '@ton/core';

import { Base64ToHex } from '../../utils';
import type { InternalTransactionId } from './types';
import type { TransactionId } from '../../types/toncenter/api';

export const padBase64 = (data: string): string => {
    return data.padEnd(data.length + (4 - (data.length % 4)), '=');
};

export const prepareAddress = (address: Address | string): string => {
    if (address instanceof Address) {
        address = address.toString();
    }
    return address;
};

export const parseInternalTransactionId = (data: InternalTransactionId): TransactionId | null => {
    if (data.hash !== 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=') {
        return {
            lt: data.lt,
            hash: Base64ToHex(data.hash),
        };
    }
    return null;
};
