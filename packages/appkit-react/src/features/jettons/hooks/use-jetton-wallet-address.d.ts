/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import type { GetJettonWalletAddressData, GetJettonWalletAddressErrorType, GetJettonWalletAddressQueryConfig } from '@ton/appkit/queries';
import type { UseQueryReturnType } from '../../../libs/query';
export type UseJettonWalletAddressParameters<selectData = GetJettonWalletAddressData> = GetJettonWalletAddressQueryConfig<selectData>;
export type UseJettonWalletAddressReturnType<selectData = GetJettonWalletAddressData> = UseQueryReturnType<selectData, GetJettonWalletAddressErrorType>;
/**
 * Hook to get jetton wallet address
 */
export declare const useJettonWalletAddress: <selectData = GetJettonWalletAddressData>(parameters?: UseJettonWalletAddressParameters<selectData>) => UseQueryReturnType<selectData, Error>;
//# sourceMappingURL=use-jetton-wallet-address.d.ts.map