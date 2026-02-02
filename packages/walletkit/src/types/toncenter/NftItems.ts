/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { NftItem } from './NftItem';
import type { Pagination } from './Pagination';

export interface NftItems {
    items: NftItem[];
    pagination: Pagination;
}
