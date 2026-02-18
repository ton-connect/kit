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

export type UseNetworkReturnType = Network | undefined;

/**
 * Hook to get network of the selected wallet
 */
export const useNetwork = (): UseNetworkReturnType => {
    const [wallet] = useSelectedWallet();

    return useMemo(() => wallet?.getNetwork(), [wallet]);
};
