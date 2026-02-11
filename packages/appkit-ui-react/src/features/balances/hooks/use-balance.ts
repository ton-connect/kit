/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { GetBalanceByAddressData } from '@ton/appkit/queries';

import { useAddress } from '../../wallets/hooks/use-address';
import { useBalanceByAddress } from './use-balance-by-address';
import type { UseBalanceByAddressParameters, UseBalanceByAddressReturnType } from './use-balance-by-address';

export type UseBalanceParameters<selectData = GetBalanceByAddressData> = UseBalanceByAddressParameters<selectData>;

export type UseBalanceReturnType<selectData = GetBalanceByAddressData> = UseBalanceByAddressReturnType<selectData>;

/**
 * Hook to get balance of the selected wallet
 */
export const useBalance = <selectData = GetBalanceByAddressData>(
    parameters: UseBalanceParameters<selectData> = {},
): UseBalanceReturnType<selectData> => {
    const address = useAddress();

    return useBalanceByAddress({ ...parameters, address });
};
