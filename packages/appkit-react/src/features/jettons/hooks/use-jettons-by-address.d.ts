/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import type { GetJettonsByAddressData, GetJettonsErrorType, GetJettonsByAddressQueryConfig } from '@ton/appkit/queries';
import type { UseQueryReturnType } from '../../../libs/query';
export type UseJettonsByAddressParameters<selectData = GetJettonsByAddressData> = GetJettonsByAddressQueryConfig<selectData>;
export type UseJettonsByAddressReturnType<selectData = GetJettonsByAddressData> = UseQueryReturnType<selectData, GetJettonsErrorType>;
/**
 * Hook to get jettons
 */
export declare const useJettonsByAddress: <selectData = GetJettonsByAddressData>(parameters?: UseJettonsByAddressParameters<selectData>) => UseJettonsByAddressReturnType<selectData>;
//# sourceMappingURL=use-jettons-by-address.d.ts.map