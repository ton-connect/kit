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
 * Parameters accepted by {@link useWatchJettons} — update callback and optional network override. The hook resolves the address from the selected wallet.
 *
 * @public
 * @category Type
 * @section Jettons
 */
export type UseWatchJettonsParameters = Partial<WatchJettonsOptions>;

/**
 * Subscribe to jetton-balance updates for the currently selected wallet. Updates flow into the TanStack Query cache so {@link useJettons} picks up the new data automatically (use {@link useWatchJettonsByAddress} for a fixed address). Requires a streaming provider registered for the network — the hook exits silently with a console warning when none is configured.
 *
 * @param parameters - {@link UseWatchJettonsParameters} Update callback and optional network override.
 * @expand parameters
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
