/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import type { GetJettonsByAddressData } from '@ton/appkit/queries';
import type { UseJettonsByAddressParameters, UseJettonsByAddressReturnType } from './use-jettons-by-address';
export type UseJettonsParameters<selectData = GetJettonsByAddressData> = UseJettonsByAddressParameters<selectData>;
export type UseJettonsReturnType<selectData = GetJettonsByAddressData> = UseJettonsByAddressReturnType<selectData>;
/**
 * Hook to get jettons of the selected wallet
 */
export declare const useJettons: <selectData = GetJettonsByAddressData>(parameters?: UseJettonsParameters<selectData>) => UseJettonsReturnType<selectData>;
//# sourceMappingURL=use-jettons.d.ts.map