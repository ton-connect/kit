/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import type { GetBalanceByAddressData, GetBalanceErrorType, GetBalanceByAddressQueryConfig } from '@ton/appkit/queries';
import type { UseQueryReturnType } from '../../../libs/query';
export type UseBalanceByAddressParameters<selectData = GetBalanceByAddressData> = GetBalanceByAddressQueryConfig<selectData>;
export type UseBalanceByAddressReturnType<selectData = GetBalanceByAddressData> = UseQueryReturnType<selectData, GetBalanceErrorType>;
/**
 * Hook to get balance
 */
export declare const useBalanceByAddress: <selectData = GetBalanceByAddressData>(parameters?: UseBalanceByAddressParameters<selectData>) => UseBalanceByAddressReturnType<selectData>;
//# sourceMappingURL=use-balance-by-address.d.ts.map