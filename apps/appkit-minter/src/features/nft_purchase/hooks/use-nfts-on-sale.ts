/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';

import { fetchNftsOnSale } from '../api/getgems-client';
import type { GetGemsNftsOnSaleResponse } from '../api/types';

export function useNftsOnSale(collectionAddress: string): UseQueryResult<GetGemsNftsOnSaleResponse, Error> {
    return useQuery({
        queryKey: ['getgems', 'nfts-on-sale', collectionAddress],
        queryFn: () => fetchNftsOnSale(collectionAddress),
        staleTime: 30_000,
    });
}
