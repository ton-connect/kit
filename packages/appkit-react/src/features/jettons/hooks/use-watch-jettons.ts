/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { WatchJettonsOptions } from '@ton/appkit';

import { useAddress } from '../../wallets/hooks/use-address';
import { useNetwork } from '../../network/hooks/use-network';
import { useWatchJettonsByAddress } from './use-watch-jettons-by-address';

export type UseWatchJettonsParameters = Partial<WatchJettonsOptions>;

/**
 * Hook to watch jetton updates of the currently selected wallet in real-time.
 * Automatically updates TanStack Query caches for jetton balances.
 */
export const useWatchJettons = (parameters: UseWatchJettonsParameters = {}): void => {
    const address = useAddress();
    const network = useNetwork();

    useWatchJettonsByAddress({ ...parameters, address, network });
};
