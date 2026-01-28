/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { WatcherOptions, WatchBalanceParameters } from '@ton/appkit';
import type { TokenAmount } from '@ton/walletkit';
import { watchBalance } from '@ton/appkit';

import { useWatcher } from './use-watcher';

export type UseBalanceOptions = Partial<WatcherOptions<TokenAmount>>;

/**
 * Hook to get balance
 */
export function useBalance(params: WatchBalanceParameters, options?: UseBalanceOptions): TokenAmount | undefined {
    const { data } = useWatcher(watchBalance, params, options);
    return data;
}
