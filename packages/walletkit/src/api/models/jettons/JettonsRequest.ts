/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Pagination } from '../core/Primitives';

/**
 * Request parameters for fetching Jetton tokens.
 */
export interface JettonsRequest {
    /**
     * Pagination information
     */
    pagination: Pagination;
}
