/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { TransactionTraceMoneyFlowItem } from '../api/models';
import type { ToncenterEmulationResponse } from './toncenter/emulation';
import type { ToncenterTransaction } from './toncenter/emulation';

/**
 * Handler for processing custom money flow items from toncenter emulation
 */
export type ProcessToncenterMoneyFlowHandler = (input: {
    transaction: ToncenterTransaction;
    emulation: ToncenterEmulationResponse;
}) => TransactionTraceMoneyFlowItem | null;
