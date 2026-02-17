/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import type { GetBalanceByAddressData } from '@ton/appkit/queries';
import type { UseBalanceByAddressParameters, UseBalanceByAddressReturnType } from './use-balance-by-address';
export type UseBalanceParameters<selectData = GetBalanceByAddressData> = UseBalanceByAddressParameters<selectData>;
export type UseBalanceReturnType<selectData = GetBalanceByAddressData> = UseBalanceByAddressReturnType<selectData>;
/**
 * Hook to get balance of the selected wallet
 */
export declare const useBalance: <selectData = GetBalanceByAddressData>(parameters?: UseBalanceParameters<selectData>) => UseBalanceReturnType<selectData>;
//# sourceMappingURL=use-balance.d.ts.map