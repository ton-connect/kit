/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Base64String } from '../core/Primitives';

export interface SendTransactionResponse {
    /**
     * BOC of the sent transaction
     */
    boc: Base64String;
}
