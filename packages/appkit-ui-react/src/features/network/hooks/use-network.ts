/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getSelectedWallet } from '@ton/appkit';
import type { Network } from '@ton/walletkit';

import { useAppKit } from '../../../hooks/use-app-kit';

export type UseNetworkReturnType = Network | undefined;

/**
 * Hook to get network of the selected wallet
 */
export const useNetwork = (): UseNetworkReturnType => {
    const appKit = useAppKit();
    const wallet = getSelectedWallet(appKit);
    return wallet?.getNetwork();
};
