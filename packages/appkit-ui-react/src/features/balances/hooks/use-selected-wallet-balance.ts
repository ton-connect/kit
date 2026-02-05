/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { GetBalanceData } from '@ton/appkit/queries';

import { useSelectedWallet } from '../../wallets/hooks/use-selected-wallet';
import type { UseBalanceParameters, UseBalanceReturnType } from './use-balance';
import { useBalance } from './use-balance';

export type UseSelectedWalletBalanceParameters = UseBalanceParameters['query'];

export type UseSelectedWalletBalanceReturnType = UseBalanceReturnType<GetBalanceData | undefined>;

/**
 * Hook to get balance of the selected wallet
 */
export const useSelectedWalletBalance = (
    queryOptions?: UseSelectedWalletBalanceParameters,
): UseSelectedWalletBalanceReturnType => {
    const [selectedWallet] = useSelectedWallet();
    const address = selectedWallet?.getAddress();

    return useBalance({
        address: address as string,
        network: selectedWallet?.getNetwork(),
        query: {
            ...queryOptions,
            enabled: !!address,
        },
    });
};
