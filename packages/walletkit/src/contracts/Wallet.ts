/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Cell } from '@ton/core';

import type { ApiClient } from '../types/toncenter/ApiClient';

export type WalletOptions = {
    code: Cell;
    workchain: number;
    client: ApiClient;
};
