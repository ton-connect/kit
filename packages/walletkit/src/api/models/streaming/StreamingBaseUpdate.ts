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
    /** The update type field */
    type: StreamingWatchType;
    /** The finality of the update */
    status: StreamingUpdateStatus;
}
