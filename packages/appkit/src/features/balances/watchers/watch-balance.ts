/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { TokenAmount } from '@ton/walletkit';
import { Network } from '@ton/walletkit';

import { createWatcher } from '../../../core/watcher';
import { getBalance } from '../actions/get-balance';

export interface WatchBalanceParameters {
    address: string;
    network?: Network;
}

export const watchBalance = createWatcher<WatchBalanceParameters, TokenAmount>((appKit, params) => {
    const { address, network: paramsNetwork } = params;
    const network = paramsNetwork || Network.mainnet();

    return {
        watcherKey: `balance-${address}-${network.chainId}`,
        watcherFn: async () => getBalance(appKit, params),
    };
});
