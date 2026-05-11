/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { UserFriendlyAddress, LogicalTime, Hex } from '../core/Primitives';

/**
 * High-level action extracted from an emulated transaction trace.
 */
export interface EmulationAction {
    /**
     * Trace identifier this action belongs to
     */
    traceId?: string;

    /**
     * Hex-encoded unique identifier of the action
     */
    actionId: Hex;

    /**
     * Logical time when the action started
     */
    startLt: LogicalTime;

    /**
     * Logical time when the action ended
     */
    endLt: LogicalTime;

    /**
     * Unix timestamp when the action started
     * @format timestamp
     */
    startUtime: number;

    /**
     * Unix timestamp when the action ended
     * @format timestamp
     */
    endUtime: number;

    /**
     * Logical time when the trace ended
     */
    traceEndLt: LogicalTime;

    /**
     * Unix timestamp when the trace ended
     * @format timestamp
     */
    traceEndUtime: number;

    /**
     * Masterchain block sequence number when the trace ended
     * @format int
     */
    traceMcSeqnoEnd: number;

    /**
     * Hex-encoded hashes of transactions involved in this action
     */
    transactions: Hex[];

    /**
     * Whether the action completed successfully
     */
    isSuccess: boolean;

    /**
     * Action type identifier (e.g. "jetton_transfer", "ton_transfer", "jetton_swap")
     */
    type: string;

    /**
     * Hex-encoded external message hash of the root trace
     */
    traceExternalHash: Hex;

    /**
     * Addresses of accounts involved in this action
     */
    accounts: UserFriendlyAddress[];

    /**
     * Action-specific detail fields keyed by name
     */
    details: { [key: string]: unknown };
}
