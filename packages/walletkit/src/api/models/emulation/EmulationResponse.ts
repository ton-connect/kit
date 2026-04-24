/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { EmulationAction } from './EmulationAction';
import type { EmulationAddressBookEntry } from './EmulationAddressBookEntry';
import type { EmulationAddressMetadata } from './EmulationAddressMetadata';
import type { EmulationTraceNode } from './EmulationTraceNode';
import type { EmulationTransaction } from './EmulationTransaction';

export interface EmulationResponse {
    mcBlockSeqno: number;
    trace: EmulationTraceNode;
    transactions: Record<string, EmulationTransaction>;
    actions: EmulationAction[];
    randSeed: string;
    isIncomplete: boolean;
    codeCells: Record<string, string>;
    dataCells: Record<string, string>;
    addressBook: Record<string, EmulationAddressBookEntry>;
    metadata: Record<string, EmulationAddressMetadata>;
}
