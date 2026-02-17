/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import type { GetJettonBalanceByAddressData, GetJettonBalanceErrorType, GetJettonBalanceByAddressQueryConfig } from '@ton/appkit/queries';
import type { UseQueryReturnType } from '../../../libs/query';
export type UseJettonBalanceByAddressParameters<selectData = GetJettonBalanceByAddressData> = GetJettonBalanceByAddressQueryConfig<selectData>;
export type UseJettonBalanceByAddressReturnType<selectData = GetJettonBalanceByAddressData> = UseQueryReturnType<selectData, GetJettonBalanceErrorType>;
/**
 * Hook to get jetton balance
 */
export declare const useJettonBalanceByAddress: <selectData = GetJettonBalanceByAddressData>(parameters?: UseJettonBalanceByAddressParameters<selectData>) => UseJettonBalanceByAddressReturnType<selectData>;
//# sourceMappingURL=use-jetton-balance-by-address.d.ts.map