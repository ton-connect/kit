/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export interface FeaturedCollection {
    address: string;
    name: string;
    description?: string;
    image?: string;
}

export const FEATURED_COLLECTIONS: readonly FeaturedCollection[] = [
    {
        address: 'EQCWB1WLs7rDJfYaeVxTZWnwQmrIFzbUcr-us-9aIn1ZNFpq',
        name: 'Featured Collection',
        description: 'Browse and buy NFTs from this collection on GetGems.',
    },
];
