/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Network } from '@ton/appkit';
import { useMemo } from 'react';

import { useSelectedWallet } from '../../wallets';

/**
 * Return type of {@link useNetwork} — `undefined` when no wallet is currently selected.
 *
 * @public
 * @category Type
 * @section Networks
 */
export type UseNetworkReturnType = Network | undefined;

/**
 * Read the {@link appkit:Network} the selected wallet is connected to; re-renders when the wallet's network changes (e.g. user switches mainnet/testnet inside the wallet).
 *
 * @returns Selected wallet's network, or `undefined` when no wallet is selected.
 *
 * @public
 * @category Hook
 * @section Networks
 */
export const useNetwork = (): UseNetworkReturnType => {
    const [wallet] = useSelectedWallet();

    return useMemo(() => wallet?.getNetwork(), [wallet]);
};
