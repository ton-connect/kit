/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ResultError } from '../core/Primitives';

export interface RequestErrorEvent {
    /**
     * Unique identifier for the request that resulted in an error
     */
    id: string;
    /**
     * Error details for the request failure
     */
    error: ResultError;

    /**
     * Additional data related to the error event
     */
    data: { [k: string]: unknown };
}
