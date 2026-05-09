/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Hex } from '../core/Primitives';

/**
 * Node in the emulation execution tree.
 */
export interface EmulationTraceNode {
    /**
     * Hex-encoded hash of the transaction at this node
     */
    txHash: Hex;

    /**
     * Hex-encoded hash of the incoming message that triggered this transaction
     */
    inMsgHash?: Hex;

    /**
     * Child nodes representing spawned messages
     */
    children: EmulationTraceNode[];
}
