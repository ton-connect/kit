/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { kit } from '../utils/bridge';

export async function approveConnectRequest(args: unknown[]) {
    return kit('approveConnectRequest', ...args);
}

export async function rejectConnectRequest(args: unknown[]) {
    return kit('rejectConnectRequest', ...args);
}

export async function approveTransactionRequest(args: unknown[]) {
    return kit('approveTransactionRequest', ...args);
}

export async function rejectTransactionRequest(args: unknown[]) {
    return kit('rejectTransactionRequest', ...args);
}

export async function approveSignDataRequest(args: unknown[]) {
    return kit('approveSignDataRequest', ...args);
}

export async function rejectSignDataRequest(args: unknown[]) {
    return kit('rejectSignDataRequest', ...args);
}
