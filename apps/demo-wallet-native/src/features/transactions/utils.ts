/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Address } from '@ton/core';
import type { Account } from '@ton/walletkit';

export const isOutgoingTx = (accounts: Account[], myAddress: string) => {
    if (accounts.length <= 0) return false;

    const myAddr = Address.parse(myAddress).toString({ bounceable: false });
    const firstAddr = accounts[0]?.address ? Address.parse(accounts[0].address).toString({ bounceable: false }) : '';

    return myAddr === firstAddr;
};
