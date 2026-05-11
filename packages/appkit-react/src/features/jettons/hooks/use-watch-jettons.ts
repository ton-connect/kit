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

/**
 * Parameters accepted by {@link useWatchJettons} — update callback and optional network override; the hook resolves the address from the selected wallet.
 *
 * @public
 * @category Type
 * @section Jettons
 */
export type UseWatchJettonsParameters = Partial<WatchJettonsOptions>;

/**
 * Subscribe to jetton-balance updates for the currently selected wallet; updates flow into the TanStack Query cache so {@link useJettons} re-renders automatically (use {@link useWatchJettonsByAddress} for a fixed address).
 *
 * @param parameters - {@link UseWatchJettonsParameters} Update callback and optional network override.
 *
 * @sample docs/examples/src/appkit/hooks/jettons#USE_WATCH_JETTONS
 *
 * @public
 * @category Hook
 * @section Jettons
 */
export const useWatchJettons = (parameters: UseWatchJettonsParameters = {}): void => {
    const address = useAddress();
    const network = useNetwork();

    useWatchJettonsByAddress({ ...parameters, address, network });
};
