/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { createTraceTypeDetector } from './create-trace-type-detector';
import { createFailureDetector } from './create-failure-detector';

const JETTON_TRIGGER_OPCODES = new Set(['0x0f8a7ea5']); // jetton_transfer initiates the flow

// These opcodes can fail without aborting the actual transfer
const JETTON_NON_CRITICAL_OPCODES = new Set([
    '0x7362d09c', // jetton_notify
    '0xd53276db', // excess
]);

export const isJettonTransferTrace = createTraceTypeDetector(JETTON_TRIGGER_OPCODES);
export const isJettonTransferFailed = createFailureDetector(JETTON_NON_CRITICAL_OPCODES);
