/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { FEATURED_COLLECTIONS } from '../lib/featured-collections';
import type { FeaturedCollection } from '../lib/featured-collections';

export function useCollections(): readonly FeaturedCollection[] {
    return FEATURED_COLLECTIONS;
}
