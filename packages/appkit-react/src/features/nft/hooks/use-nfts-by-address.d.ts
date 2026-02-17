/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import type { GetNFTsData, GetNFTsErrorType, GetNFTsQueryConfig } from '@ton/appkit/queries';
import type { UseQueryReturnType } from '../../../libs/query';
export type UseNFTsByAddressParameters<selectData = GetNFTsData> = GetNFTsQueryConfig<selectData>;
export type UseNFTsByAddressReturnType<selectData = GetNFTsData> = UseQueryReturnType<selectData, GetNFTsErrorType>;
/**
 * Hook to get NFTs
 */
export declare const useNFTsByAddress: <selectData = GetNFTsData>(parameters?: UseNFTsByAddressParameters<selectData>) => UseNFTsByAddressReturnType<selectData>;
//# sourceMappingURL=use-nfts-by-address.d.ts.map