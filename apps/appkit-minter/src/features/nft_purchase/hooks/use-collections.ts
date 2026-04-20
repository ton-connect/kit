/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';

import { fetchCollection } from '../api/getgems-client';
import type { GetGemsCollection } from '../api/types';
import { FEATURED_COLLECTION_ADDRESSES } from '../lib/featured-collections';

export function useFeaturedCollectionAddresses(): readonly string[] {
    return FEATURED_COLLECTION_ADDRESSES;
}

export function useCollection(address: string): UseQueryResult<GetGemsCollection, Error> {
    return useQuery({
        queryKey: ['getgems', 'collection', address],
        queryFn: () => fetchCollection(address),
        staleTime: 5 * 60_000,
    });
}
