/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import type { GetNFTsData } from '@ton/appkit/queries';
import type { UseNFTsByAddressParameters, UseNFTsByAddressReturnType } from './use-nfts-by-address';
export type UseNFTsParameters<selectData = GetNFTsData> = UseNFTsByAddressParameters<selectData>;
export type UseNFTsReturnType<selectData = GetNFTsData> = UseNFTsByAddressReturnType<selectData>;
/**
 * Hook to get NFTs of the selected wallet
 */
export declare const useNfts: <selectData = GetNFTsData>(parameters?: UseNFTsParameters<selectData>) => UseNFTsReturnType<selectData>;
//# sourceMappingURL=use-nfts.d.ts.map