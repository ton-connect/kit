/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Address } from '@ton/core';

import { Base64ToHex } from '../../utils';
import type { InternalTransactionId } from './types/internal';
import type { TransactionId } from '../../api/models';

export const padBase64 = (data: string): string => {
    return data.padEnd(data.length + (4 - (data.length % 4)), '=');
};

export const parseMsgSizeCount = (value: string | undefined): number | undefined => {
    if (value === undefined) return undefined;
    const num = Number(value);
    if (!Number.isFinite(num)) return undefined;
    return Math.trunc(num);
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
