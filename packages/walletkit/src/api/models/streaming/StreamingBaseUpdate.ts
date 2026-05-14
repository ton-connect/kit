/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { StreamingWatchType } from './StreamingWatchType';
import type { StreamingUpdateStatus } from './StreamingUpdateStatus';

export interface StreamingBaseUpdate {
    /** Discriminator identifying the kind of streaming update (`'balance'`, `'jettons'`, `'transactions'`). */
    type: StreamingWatchType;
    /** Finality stage of the update — see {@link StreamingUpdateStatus}. */
    status: StreamingUpdateStatus;
}
