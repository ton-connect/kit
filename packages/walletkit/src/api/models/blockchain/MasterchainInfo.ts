/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Hex } from '../core/Primitives';

/**
 * Information about the latest masterchain block.
 */
export interface MasterchainInfo {
    /**
     * Sequence number of the masterchain block
     * @format int
     */
    seqno: number;

    /**
     * Shard identifier of the block
     */
    shard: string;

    /**
     * Workchain ID of the block
     * @format int
     */
    workchain: number;

    /**
     * File hash of the block
     */
    fileHash: Hex;

    /**
     * Root hash of the block
     */
    rootHash: Hex;
}
