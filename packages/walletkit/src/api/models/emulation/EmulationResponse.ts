/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Hex, Base64String } from '../core/Primitives';
import type { EmulationAction } from './EmulationAction';
import type { EmulationAddressBookEntry } from './EmulationAddressBookEntry';
import type { EmulationTraceNode } from './EmulationTraceNode';
import type { EmulationTransaction } from './EmulationTransaction';

/**
 * Unified emulation response model, normalised from either Toncenter or TonAPI sources.
 */
export interface EmulationResponse {
    /**
     * Masterchain block sequence number used during emulation
     * @format int
     */
    mcBlockSeqno: number;

    /**
     * Root node of the transaction execution tree
     */
    trace: EmulationTraceNode;

    /**
     * Map of transaction hashes to transaction details
     */
    transactions: Record<string, EmulationTransaction>;

    /**
     * High-level actions extracted from the trace
     */
    actions: EmulationAction[];

    /**
     * Random seed used during emulation, hex-encoded
     */
    randSeed: Hex;

    /**
     * Whether the trace is incomplete due to limits or errors
     */
    isIncomplete: boolean;

    /**
     * Map of code cell hashes to their BOC base64 representations
     */
    codeCells: Record<string, Base64String>;

    /**
     * Map of data cell hashes to their BOC base64 representations
     */
    dataCells: Record<string, Base64String>;

    /**
     * Address book mapping raw addresses to human-readable metadata
     */
    addressBook: Record<string, EmulationAddressBookEntry>;
}
