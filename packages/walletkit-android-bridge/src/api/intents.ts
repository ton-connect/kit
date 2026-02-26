/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * intents.ts – Bridge API for intent operations
 */

import { kit } from '../utils/bridge';

export async function isIntentUrl(args: unknown[]) {
    return kit('isIntentUrl', ...args);
}

export async function handleIntentUrl(args: unknown[]) {
    return kit('handleIntentUrl', ...args);
}

export async function approveTransactionIntent(args: unknown[]) {
    return kit('approveTransactionIntent', ...args);
}

export async function approveSignDataIntent(args: unknown[]) {
    return kit('approveSignDataIntent', ...args);
}

export async function approveActionIntent(args: unknown[]) {
    return kit('approveActionIntent', ...args);
}

export async function rejectIntent(args: unknown[]) {
    return kit('rejectIntent', ...args);
}

export async function intentItemsToTransactionRequest(args: unknown[]) {
    return kit('intentItemsToTransactionRequest', ...args);
}

export async function processConnectAfterIntent(args: unknown[]) {
    return kit('processConnectAfterIntent', ...args);
}
